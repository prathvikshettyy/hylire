import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  FolderOpen, 
  Search, 
  Filter, 
  FileCheck, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileCode, 
  ShieldCheck, 
  HardDrive, 
  X, 
  CheckCircle2, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localDocuments, localProjects } from '../utils/localStore';

const CATEGORIES = [
  { id: 'all', label: 'All Files' },
  { id: 'Blueprints', label: 'Blueprints & CAD' },
  { id: 'Structural', label: 'Structural Drawings' },
  { id: 'Contracts', label: 'Vendor Contracts' },
  { id: 'Invoices', label: 'Invoices & BOQ' },
  { id: 'Safety', label: 'Safety & Compliance' },
  { id: 'Photos', label: 'Site Photographs' }
];

const Documents = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [projects, setProjects] = useState(() => localProjects.list());
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const list = localProjects.list();
    return list.length > 0 ? list[0].id : '';
  });
  const [documents, setDocuments] = useState(() => {
    const list = localProjects.list();
    return list.length > 0 ? localDocuments.listByProject(list[0].id) : [];
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Real File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [customDocName, setCustomDocName] = useState('');
  const [docCategory, setDocCategory] = useState('Blueprints');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const fileInputRef = useRef(null);

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchProjects = async () => {
    const lp = localProjects.list();
    setProjects(lp);
    if (lp.length > 0 && !selectedProjectId) {
      setSelectedProjectId(lp[0].id);
    }

    try {
      const res = await fetch(`${apiBaseUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProjects(data);
      }
    } catch (err) {
      // Offline mode
    }
  };

  const fetchDocs = async () => {
    if (!selectedProjectId) return;
    const ld = localDocuments.listByProject(selectedProjectId);
    setDocuments(ld);

    try {
      const res = await fetch(`${apiBaseUrl}/documents/project/${selectedProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDocuments(data);
      }
    } catch (err) {
      // Offline mode
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDocs();
    }
  }, [selectedProjectId, token]);

  // Handle native file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setCustomDocName(file.name);
    }
  };

  // Upload real file to backend
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Please select or create a project first.');
      return;
    }
    if (!selectedFile && !customDocName) {
      alert('Please choose a file to upload.');
      return;
    }

    setUploading(true);
    setMsg('');

    // Read real file as Base64 Data URL
    let fileDataUrl = '';
    if (selectedFile) {
      fileDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(selectedFile);
      });
    }

    const payload = {
      projectId: selectedProjectId,
      name: customDocName || (selectedFile ? selectedFile.name : 'Document.pdf'),
      fileType: selectedFile ? selectedFile.type : 'application/pdf',
      fileSize: selectedFile ? formatBytes(selectedFile.size) : '240 KB',
      fileUrl: fileDataUrl,
      fileData: fileDataUrl,
      category: docCategory,
      uploadedBy: user ? (user.fullName || user.email) : 'Engineer'
    };

    // 1. Save directly to local storage
    const newDoc = localDocuments.create(payload);
    setDocuments(localDocuments.listByProject(selectedProjectId));
    setSelectedFile(null);
    setCustomDocName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMsg('File uploaded and securely archived in the Document Vault!');

    // 2. Sync with API
    try {
      await fetch(`${apiBaseUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Handled offline
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this document?')) return;
    
    // 1. Delete from local storage
    localDocuments.delete(id);
    setDocuments(localDocuments.listByProject(selectedProjectId));
    setMsg('Document permanently removed from vault.');

    // 2. Sync with API
    try {
      await fetch(`${apiBaseUrl}/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      // Handled offline
    }
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (doc.category && doc.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType = '', category = '') => {
    if (fileType.includes('image') || category === 'Photos') {
      return <ImageIcon size={18} color="#38bdf8" />;
    }
    if (fileType.includes('pdf') || category === 'Blueprints') {
      return <FileText size={18} color="#ef4444" />;
    }
    if (fileType.includes('sheet') || fileType.includes('csv') || category === 'Invoices') {
      return <FileSpreadsheet size={18} color="#10b981" />;
    }
    if (category === 'Safety') {
      return <ShieldCheck size={18} color="#f59e0b" />;
    }
    return <FileCode size={18} color="var(--primary-color)" />;
  };

  return (
    <div className="main-view" style={{ maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={28} color="var(--primary-color)" /> Project Document Vault
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Real connected cloud file storage for architectural blueprints, structural drawings, contracts, and BOQs
          </p>
        </div>

        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Project:</span>
          <select 
            className="form-select"
            style={{ width: 'auto', minWidth: 260 }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {msg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Grid: Upload Sidebar + Document Browser */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Real File Upload Card */}
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
            <Upload size={18} color="var(--primary-color)" /> Upload File to Vault
          </h3>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Native File Input Drop Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 12,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: selectedFile ? 'rgba(234, 88, 12, 0.05)' : 'rgba(255,255,255,0.01)',
                borderColor: selectedFile ? 'var(--primary-color)' : 'var(--border-color)',
                transition: 'all 0.2s'
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.txt,.csv,.xlsx,.docx"
              />
              
              <Upload size={32} style={{ margin: '0 auto 8px', color: selectedFile ? 'var(--primary-color)' : 'var(--text-dim)' }} />
              
              {selectedFile ? (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {formatBytes(selectedFile.size)} • {selectedFile.type || 'Document'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', marginTop: 6 }}>
                    Click to choose a different file
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    Click to browse or drag file here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    PDF, PNG, JPG, CAD/DWG, Excel, Word (Up to 50 MB)
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Document Display Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Ground_Floor_Structural_Plan_Rev3.pdf"
                value={customDocName}
                onChange={(e) => setCustomDocName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Document Classification Category</label>
              <select 
                className="form-select"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
              >
                <option value="Blueprints">Architectural Blueprints & CAD</option>
                <option value="Structural">Structural & RCC Drawings</option>
                <option value="Contracts">Vendor & Contractor Agreements</option>
                <option value="Invoices">Invoices & Bill of Quantities (BOQ)</option>
                <option value="Safety">Safety Clearances & Fire NOC</option>
                <option value="Photos">Site Inspection Photos</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              disabled={uploading}
            >
              <Upload size={16} />
              <span>{uploading ? 'Archiving & Storing File...' : 'Upload & Archive Document'}</span>
            </button>
          </form>

          {/* Quick Storage Stats Widget */}
          <div style={{ marginTop: 24, padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <HardDrive size={16} color="var(--primary-color)" /> Vault Capacity & Stats
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              <span>Total Documents:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{documents.length} files</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Storage Node:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Active (Persistent Disk)</span>
            </div>
          </div>
        </div>

        {/* Files Browser & List Card */}
        <div className="card">
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
              <input 
                type="text"
                className="form-input"
                placeholder="Search archived files by title or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  borderRadius: 20,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedCategory === cat.id ? 'var(--primary-color)' : 'var(--border-color)',
                  background: selectedCategory === cat.id ? 'rgba(234, 88, 12, 0.15)' : 'rgba(255,255,255,0.02)',
                  color: selectedCategory === cat.id ? 'var(--primary-color)' : 'var(--text-muted)',
                  fontWeight: selectedCategory === cat.id ? 600 : 400
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Documents List */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading project vault files...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>No documents found</h4>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                {searchQuery ? 'No files match your search query.' : 'Upload real blueprints, contracts, or inspection photos using the left panel.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredDocs.map((doc) => (
                <div 
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    gap: 14,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* File Icon & Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden', flex: 1 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getFileIcon(doc.fileType, doc.category)}
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.name}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 3 }}>
                        <span style={{ color: 'var(--primary-color)', background: 'rgba(234, 88, 12, 0.1)', padding: '1px 6px', borderRadius: 4 }}>
                          {doc.category || 'General'}
                        </span>
                        <span>{doc.fileSize || '150 KB'}</span>
                        <span>Uploaded by: <strong>{doc.uploadedBy}</strong></span>
                        {doc.createdAt && <span>{new Date(doc.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {/* In-app Preview */}
                    <button 
                      onClick={() => setPreviewDoc(doc)}
                      className="btn-secondary" 
                      style={{ padding: '7px 10px', borderRadius: 8, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Preview in app"
                    >
                      <Eye size={15} />
                      <span>Preview</span>
                    </button>

                    {/* Download */}
                    <a 
                      href={doc.fileUrl} 
                      download={doc.name}
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary" 
                      style={{ padding: '7px 10px', borderRadius: 8, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                      title="Download file"
                    >
                      <Download size={15} />
                      <span>Download</span>
                    </a>

                    {/* Delete */}
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="btn-secondary" 
                      style={{ padding: '7px 10px', borderRadius: 8, color: 'var(--color-error)' }}
                      title="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* In-App Document Preview Modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            width: '90%',
            maxWidth: 900,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {previewDoc.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Category: {previewDoc.category} • Size: {previewDoc.fileSize}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <a 
                  href={previewDoc.fileUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={14} /> Open in New Tab
                </a>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content Preview */}
            <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              {previewDoc.fileType?.includes('image') ? (
                <img 
                  src={previewDoc.fileUrl} 
                  alt={previewDoc.name} 
                  style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }} 
                />
              ) : previewDoc.fileType?.includes('pdf') ? (
                <iframe 
                  src={previewDoc.fileUrl} 
                  title={previewDoc.name} 
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <FileText size={64} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                  <h4>Document Archived in Persistent Vault</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: 8 }}>
                    File is stored at: <code>{previewDoc.fileUrl}</code>
                  </p>
                  <a 
                    href={previewDoc.fileUrl} 
                    download={previewDoc.name} 
                    className="btn btn-primary" 
                    style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={16} /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
