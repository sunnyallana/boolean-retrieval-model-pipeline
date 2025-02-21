import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Search, Trash2, FileText, Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';;


const DocumentItem = React.memo(({ data, index, style, onClick }) => {
  const doc = data[index];
  return (
    <div style={style}>
      <div 
        className="p-4 border border-gray-700 rounded-lg mx-2 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
        onClick={() => onClick(doc)}
      >
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium text-gray-100 truncate">{doc.name}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{doc.content}</p>
            <div className="mt-2 text-xs inline-flex items-center px-2 py-1 rounded-full bg-gray-700 text-blue-300">
              Click to view details
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const InstructionsPanel = () => (
  <div className="bg-gray-800 p-6 rounded-lg mb-6 border border-gray-700">
    <h2 className="text-lg font-semibold text-blue-300 mb-4">How to Use This System</h2>
    
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-blue-400 mb-2">1. Upload Stopwords</h3>
        <div className="text-gray-300">
          <p>Create a .txt file with one stopword per line. For example:</p>
          <pre className="bg-gray-900 p-3 rounded mt-2 text-sm overflow-x-auto font-mono text-gray-300 whitespace-pre-wrap">
{`a
an
the
in
on`}
          </pre>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-blue-400 mb-2">2. Upload Documents</h3>
        <p className="text-gray-300">Upload one or more .txt files containing the documents you want to search through.</p>
      </div>
      
      <div>
        <h3 className="font-medium text-blue-400 mb-2">3. Search Options</h3>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li><strong className="text-blue-300">Boolean Search:</strong> Use AND, OR, NOT operators (e.g., "cat AND dog NOT fish")</li>
          <li><strong className="text-blue-300">Proximity Search:</strong> Find words within a specific distance (e.g., "data analytics /3" finds documents where "data" and "analytics" appear within 3 words of each other)</li>
        </ul>
      </div>
    </div>
  </div>
);

const DocumentModal = ({ document, onClose, loading }) => {
  if (!document) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-300">Document Details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-100 mb-2">Document ID: {document.doc_id}</h3>
            <p className="text-sm text-gray-400">Filename: {document.name}</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h4 className="font-medium text-gray-200 mb-2">Content:</h4>
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono overflow-x-auto p-2 bg-gray-900 rounded">
                {document.fullContent}
              </pre>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchResults = ({ results, documents, onDocumentClick, currentPage, totalPages, onPageChange }) => {
  const itemsPerPage = 5;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedResults = results.slice(startIdx, endIdx);

  return results.length > 0 && (
    <div className="bg-gray-800 p-6 rounded-lg mb-6 border border-gray-700">
      <h2 className="text-xl font-semibold text-green-300 mb-4">Search Results ({results.length})</h2>
      <div className="grid gap-4 mb-4">
        {paginatedResults.map((docId, index) => {
          const doc = documents.find(d => d.doc_id === docId);
          if (!doc) return null;
          
          return (
            <div 
              key={docId} 
              className="bg-gray-900 p-4 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => onDocumentClick(doc)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-900 rounded-full w-8 h-8 flex items-center justify-center text-green-300 font-medium">
                  {startIdx + index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-green-300">Document ID: {docId}</h3>
                  <p className="text-sm text-gray-400">{doc.name}</p>
                </div>
                <div className="text-sm bg-green-900 px-3 py-1 rounded-full text-green-300">
                  View details
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Results Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {startIdx + 1} to {Math.min(endIdx, results.length)} of {results.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent text-green-400"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent text-green-400"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function DocumentSearchSystem() {
  const [stopwordsFile, setStopwordsFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('boolean');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentResultPage, setCurrentResultPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  const itemsPerPage = 50;
  const resultsPerPage = 5;
  
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const totalResultPages = Math.ceil(searchResults.length / resultsPerPage);
  
  const currentDocuments = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentResultPage(1);
  }, [searchResults]);

  const handleStopwordsUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      setStopwordsFile(file);
      setSuccess('Stopwords file uploaded successfully');
      setError('');
    } else {
      setError('Please upload a valid .txt file for stopwords');
    }
  };

  const handleDocumentUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError('');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files[]', file);
    });

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        const newDocs = data.results.map(result => ({
          name: result.name,
          doc_id: result.doc_id,
          content: `Document ID: ${result.doc_id}`,
          fullContent: null
        }));
        setDocuments(prev => [...prev, ...newDocs]);
        setSuccess(`Successfully processed ${data.processed} documents`);
        
        if (data.errors.length > 0) {
          setError(`Some files had errors: ${data.errors.join(', ')}`);
        }
      } else {
        setError(data.error || 'Failed to upload documents');
      }
    } catch (err) {
      setError('Error uploading documents: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          type: searchType
        })
      });

      const data = await response.json();
      setSearchResults(data.results);
      setSuccess(`Found ${data.results.length} matching documents`);
      setCurrentResultPage(1);
    } catch (err) {
      setError('Error performing search: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/clear`, {
        method: 'POST'
      });
      if (response.ok) {
        setDocuments([]);
        setSearchResults([]);
        setCurrentPage(1);
        setCurrentResultPage(1);
        setSuccess('All documents cleared successfully');
      }
    } catch (err) {
      setError('Error clearing documents: ' + err.message);
    }
  };

  const fetchDocumentContent = async (docId) => {
    setModalLoading(true);
    try {
      const response = await fetch(`${API_URL}/document/${docId}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setDocuments(prevDocs => prevDocs.map(doc => 
          doc.doc_id === docId ? { ...doc, fullContent: data.content } : doc
        ));
        
        setSelectedDocument(prev => {
          if (prev && prev.doc_id === docId) {
            return { ...prev, fullContent: data.content };
          }
          return prev;
        });
        
        return data.content;
      } else {
        throw new Error('Failed to fetch document content');
      }
    } catch (err) {
      setError(`Error fetching document content: ${err.message}`);
      return "Error loading document content. Please try again.";
    } finally {
      setModalLoading(false);
    }
  };

  const handleDocumentClick = async (document) => {
    setSelectedDocument(document);
    
    if (!document.fullContent) {
      try {
        await fetchDocumentContent(document.doc_id);
      } catch (err) {
        console.error("Failed to fetch document content:", err);
      }
    }
  };

  const Pagination = ({ current, total, onChange, className = "" }) => (
    <div className={`flex items-center justify-between mt-4 px-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">
          Showing {((current - 1) * itemsPerPage) + 1} to {Math.min(current * itemsPerPage, documents.length)} of {documents.length} documents
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current === 1}
          className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent text-blue-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-400">
          Page {current} of {total || 1}
        </span>
        <button
          onClick={() => onChange(Math.min(total, current + 1))}
          disabled={current === total || total === 0}
          className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent text-blue-400"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );  

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-gray-200">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-300 mb-8">Document Search System</h1>
        
        <InstructionsPanel />
        
        {error && (
          <div className="mb-4 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Stopwords File</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-blue-300 rounded-lg cursor-pointer hover:bg-blue-800 transition-colors">
                <Upload className="h-5 w-5" />
                <span>Choose File</span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleStopwordsUpload}
                  className="hidden"
                />
              </label>
              {stopwordsFile && <span className="text-sm text-gray-400">{stopwordsFile.name}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Documents</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-blue-300 rounded-lg cursor-pointer hover:bg-blue-800 transition-colors">
                <Upload className="h-5 w-5" />
                <span>Choose Files</span>
                <input
                  type="file"
                  accept=".txt"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={clearDocuments}
                className="flex items-center gap-2 px-4 py-2 bg-red-900 text-red-300 rounded-lg hover:bg-red-800 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your search query..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-500"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200"
            >
              <option value="boolean">Boolean Search</option>
              <option value="proximity">Proximity Search</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-900 disabled:text-blue-300"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              Search
            </button>
          </div>
        </div>

        <SearchResults 
          results={searchResults} 
          documents={documents}
          onDocumentClick={handleDocumentClick}
          currentPage={currentResultPage}
          totalPages={totalResultPages}
          onPageChange={setCurrentResultPage}
        />

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Documents ({documents.length})</h2>
          
          <div className="h-96">
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  itemCount={currentDocuments.length}
                  itemSize={150}
                  width={width}
                  itemData={currentDocuments}
                  itemKey={(index, data) => data[index].doc_id}
                >
                  {({ data, index, style }) => (
                    <DocumentItem 
                      data={data} 
                      index={index} 
                      style={style} 
                      onClick={handleDocumentClick}
                    />
                  )}
                </List>
              )}
            </AutoSizer>
          </div>
          
          <Pagination 
            current={currentPage} 
            total={totalPages} 
            onChange={setCurrentPage} 
          />
        </div>
      </div>

      {selectedDocument && (
        <DocumentModal 
          document={selectedDocument} 
          loading={modalLoading}
          onClose={() => setSelectedDocument(null)} 
        />
      )}
    </div>
  );
}
