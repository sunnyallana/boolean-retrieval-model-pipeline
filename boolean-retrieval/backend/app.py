from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import re
from nltk.stem import PorterStemmer
from collections import defaultdict
from flask_cors import CORS
import threading
from concurrent.futures import ThreadPoolExecutor
import queue
import time
import logging
from typing import Set, Dict, List, Any
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt'}
MAX_WORKERS = 4
BATCH_SIZE = 100
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global state with thread-safe containers
class SearchState:
    def __init__(self):
        self.inverted_index: Dict[str, Set[str]] = defaultdict(set)
        self.positional_index: Dict[str, Dict[str, List[int]]] = defaultdict(lambda: defaultdict(list))
        self.all_docs: Set[str] = set()
        self.stopwords: Set[str] = set()
        self.lock = threading.Lock()
        self.processing_queue = queue.Queue()
        self.is_processing = False
        self.processed_count = 0
        self.total_files = 0

search_state = SearchState()

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess(text: str, stopwords: Set[str], stemmer: PorterStemmer) -> List[str]:
    # Optimize tokenization for large texts
    tokens = re.findall(r'\w+', text.lower())
    return [stemmer.stem(token) for token in tokens if token not in stopwords]

def process_file(filepath: str, doc_id: str, stopwords: Set[str]) -> Dict[str, Any]:
    try:
        stemmer = PorterStemmer()
        local_inverted_index = defaultdict(set)
        local_positional_index = defaultdict(lambda: defaultdict(list))

        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
            tokens = preprocess(text, stopwords, stemmer)
            
            for pos, term in enumerate(tokens):
                local_inverted_index[term].add(doc_id)
                local_positional_index[term][doc_id].append(pos)

        return {
            'success': True,
            'doc_id': doc_id,
            'inverted_index': dict(local_inverted_index),
            'positional_index': dict(local_positional_index),
            'content': text[:200] + '...' if len(text) > 200 else text
        }
    except Exception as e:
        logger.error(f"Error processing file {filepath}: {str(e)}")
        return {'success': False, 'doc_id': doc_id, 'error': str(e)}

def merge_indexes(result: Dict[str, Any]) -> None:
    if not result['success']:
        return

    with search_state.lock:
        # Merge inverted index
        for term, docs in result['inverted_index'].items():
            search_state.inverted_index[term].update(docs)
        
        # Merge positional index
        for term, docs in result['positional_index'].items():
            for doc_id, positions in docs.items():
                search_state.positional_index[term][doc_id].extend(positions)
        
        search_state.all_docs.add(result['doc_id'])
        search_state.processed_count += 1

def process_files_batch(files: List[Dict[str, Any]]) -> None:
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []
        for file_info in files:
            filepath = file_info['path']
            doc_id = file_info['doc_id']
            futures.append(executor.submit(process_file, filepath, doc_id, search_state.stopwords))
        
        for future in futures:
            try:
                result = future.result()
                if result['success']:
                    merge_indexes(result)
            except Exception as e:
                logger.error(f"Error in batch processing: {str(e)}")

@app.route('/upload-stopwords', methods=['POST'])
def upload_stopwords():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file and allowed_file(file.filename):
        try:
            content = file.read().decode('utf-8', errors='ignore')
            search_state.stopwords = set(word.strip() for word in content.splitlines() if word.strip())
            return jsonify({'message': 'Stopwords uploaded successfully', 'count': len(search_state.stopwords)})
        except Exception as e:
            return jsonify({'error': f'Error processing stopwords: {str(e)}'}), 500
    return jsonify({'error': 'Invalid file format'}), 400

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files part'}), 400

    files = request.files.getlist('files[]')
    if not files:
        return jsonify({'error': 'No files selected'}), 400

    processing_batch = []
    results = []
    errors = []

    for file in files:
        if file and allowed_file(file.filename):
            try:
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                doc_id = filename.split('.')[0]
                processing_batch.append({
                    'path': filepath,
                    'doc_id': doc_id,
                    'name': filename
                })
            except Exception as e:
                errors.append(f"Error saving {file.filename}: {str(e)}")
        else:
            if file.filename:
                errors.append(f"Invalid file type: {file.filename}")

    if processing_batch:
        try:
            process_files_batch(processing_batch)
            for file_info in processing_batch:
                results.append({
                    'name': file_info['name'],
                    'doc_id': file_info['doc_id']
                })
        except Exception as e:
            errors.append(f"Error in batch processing: {str(e)}")

    return jsonify({
        'message': 'Files processed successfully',
        'processed': len(results),
        'errors': errors,
        'results': results
    })

@app.route('/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '').strip()
    query_type = data.get('type', 'boolean')

    if not query:
        return jsonify({'error': 'Empty query'}), 400

    try:
        stemmer = PorterStemmer()
        if query_type == 'proximity':
            results = process_proximity_query(query, search_state.inverted_index, 
                                           search_state.positional_index, search_state.stopwords)
        else:
            results = process_boolean_query(query, search_state.inverted_index, 
                                          search_state.all_docs, search_state.stopwords)

        return jsonify({
            'results': sorted(list(results), key=int),
            'query': query,
            'type': query_type
        })
    except Exception as e:
        return jsonify({'error': f'Search error: {str(e)}'}), 500

def process_boolean_query(query: str, inverted_index: Dict[str, Set[str]], 
                        all_docs: Set[str], stopwords: Set[str]) -> Set[str]:
    stemmer = PorterStemmer()
    tokens = query.split()
    stack = []
    current_op = None

    i = 0
    while i < len(tokens):
        token = tokens[i]
        
        if token in ('AND', 'OR'):
            current_op = token
            i += 1
            continue
            
        if token == 'NOT':
            if i + 1 >= len(tokens):
                return set()
                
            term = stemmer.stem(tokens[i + 1].lower())
            if term in stopwords:
                docs = set()
            else:
                docs = all_docs - inverted_index.get(term, set())
            stack.append(docs)
            i += 2
            
        else:
            term = stemmer.stem(token.lower())
            if term in stopwords:
                docs = set()
            else:
                docs = inverted_index.get(term, set())
            
            if current_op == 'AND' and stack:
                docs = stack.pop() & docs
            elif current_op == 'OR' and stack:
                docs = stack.pop() | docs
            
            stack.append(docs)
            i += 1
            
    return stack[0] if stack else set()

def process_proximity_query(query: str, inverted_index: Dict[str, Set[str]], 
                          positional_index: Dict[str, Dict[str, List[int]]], 
                          stopwords: Set[str]) -> Set[str]:
    stemmer = PorterStemmer()
    parts = query.split()
    
    for i, part in enumerate(parts):
        if '/' in part:
            if i < 2:
                return set()
                
            try:
                term1 = stemmer.stem(parts[i-2].lower())
                term2 = stemmer.stem(parts[i-1].lower())
                k = int(part.split('/')[1])
                
                if term1 in stopwords or term2 in stopwords:
                    return set()
                    
                docs1 = inverted_index.get(term1, set())
                docs2 = inverted_index.get(term2, set())
                common_docs = docs1 & docs2
                
                results = set()
                for doc_id in common_docs:
                    pos1_list = positional_index.get(term1, {}).get(doc_id, [])
                    pos2_list = positional_index.get(term2, {}).get(doc_id, [])
                    
                    # Optimize position comparison
                    pos2_set = set(pos2_list)
                    for pos1 in pos1_list:
                        if any(abs(pos1 - pos2) <= k + 1 for pos2 in pos2_set):
                            results.add(doc_id)
                            break
                            
                return results
            except (ValueError, IndexError):
                return set()
    
    return set()

@app.route('/clear', methods=['POST'])
def clear_indexes():
    try:
        # Clear indexes
        with search_state.lock:
            search_state.inverted_index.clear()
            search_state.positional_index.clear()
            search_state.all_docs.clear()
            
        # Clear uploaded files
        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(filepath):
                os.remove(filepath)
                
        return jsonify({'message': 'All indexes and files cleared successfully'})
    except Exception as e:
        return jsonify({'error': f'Error clearing indexes: {str(e)}'}), 500

@app.route('/document/<doc_id>', methods=['GET'])
def get_document(doc_id):
    try:
        # Find the document file in the upload folder
        document_file = None
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename.split('.')[0] == doc_id and os.path.isfile(os.path.join(UPLOAD_FOLDER, filename)):
                document_file = os.path.join(UPLOAD_FOLDER, filename)
                break
        
        if not document_file:
            return jsonify({'error': f'Document ID {doc_id} not found'}), 404
            
        # Read the document content
        with open(document_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        return jsonify({
            'doc_id': doc_id,
            'content': content,
            'size': len(content)
        })
        
    except Exception as e:
        logger.error(f"Error retrieving document {doc_id}: {str(e)}")
        return jsonify({'error': f'Error retrieving document: {str(e)}'}), 500


@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        'processed_files': len(search_state.all_docs),
        'unique_terms': len(search_state.inverted_index),
        'stopwords_count': len(search_state.stopwords)
    })

if __name__ == '__main__':
    app.run(debug=True, threaded=True)