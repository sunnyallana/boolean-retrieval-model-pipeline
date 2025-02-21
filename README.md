# Document Search System

A robust document search engine built with Flask and React that supports boolean and proximity search operations. This system allows users to upload text documents and perform advanced searches with real-time indexing.

## Features

- Boolean search operations (AND, OR, NOT)
- Proximity search with customizable word distance
- Stopwords management
- Multi-threaded document processing
- Real-time indexing status
- Document content viewer
- Support for large text files (up to 32MB)

## Prerequisites

- Python 3.7+
- Node.js 14+
- npm or yarn

## 🛠Installation

### Backend Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # For Windows use: venv\Scripts\activate
```

2. Install dependencies using requirements.txt:
```bash
pip install -r requirements.txt
```

3. Create required directory:
```bash
mkdir uploads
```

2. Install dependencies using requirements.txt:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the Flask backend:
```bash
python app.py
```
The server will start at http://localhost:5000

2. In a new terminal, start the React frontend:
```bash
cd frontend
npm start
```
Access the application at http://localhost:3000


### Usage Guide

#### Document Upload

1. Click the "Upload Files" button
2. Select one or more .txt files
3. Wait for processing completion

#### Stopwords Management

1. Create a text file with stopwords (one per line)
2. Upload via the stopwords upload feature
3. System automatically applies stopwords to searches

#### Search Operations

##### Boolean Search
Use AND, OR, NOT operators to combine search terms:

```
computer AND science
technology OR programming
software NOT bugs
```


##### Proximity Search
Find words within a specific distance:

```
data science /5    # Finds "data" and "science" within 5 words
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload documents |
| `/upload-stopwords` | POST | Upload stopwords file |
| `/search` | POST | Perform search |
| `/status` | GET | Get system status |
| `/clear` | POST | Clear indexes |
| `/document/<doc_id>` | GET | Get document content |

### Error Handling
The system provides clear error messages for:

- Invalid file types
- Processing errors
- Search syntax errors
- System errors

### Security Features

- Secure filename handling
- Input validation
- File size restrictions (32MB max)
- CORS protection

### Troubleshooting
If you encounter issues:

1. Check if both servers are running
2. Verify uploads directory permissions
3. Check console for error messages
4. Ensure all dependencies are installed
5. Try clearing indexes and restarting

### Development Notes

- Uses Flask for backend API
- React for frontend interface
- Multi-threaded document processing
- Real-time status updates
- Memory-efficient indexing

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

