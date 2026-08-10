import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash, Eye, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Documents = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // File upload state mocks
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('application/pdf');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      setProjects([
        { id: "p-1", name: "Apex Commercial Tower" },
        { id: "p-2", name: "Riverview Residential Complex" }
      ]);
      setSelectedProjectId("p-1");
    }
  };

  const fetchDocs = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/documents/project/${selectedProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      // Static documents fallback scoped by project
      const mockDocs = [
        { id: "d-1", projectId: "p-1", name: "Apex_Structural_Blueprints.pdf", fileUrl: "#", fileType: "application/pdf", uploadedBy: " Sarah E." },
        { id: "d-2", projectId: "p-1", name: "Soil_Testing_Report_Final.pdf", fileUrl: "#", fileType: "application/pdf", uploadedBy: " Sarah E." },
        { id: "d-3", projectId: "p-2", name: "Contract_Builder_Agreement_Signed.pdf", fileUrl: "#", fileType: "application/pdf", uploadedBy: " John B." }
      ];
      setDocuments(mockDocs.filter(d => d.projectId === selectedProjectId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    fetchDocs();
  }, [selectedProjectId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileName || !selectedProjectId) return;

    setUploading(true);
    setMsg('');
    
    const payload = {
      projectId: selectedProjectId,
      name: fileName,
      fileType,
      uploadedBy: user ? user.fullName : 'Sarah E.'
    };

    try {
      const res = await fetch(`${apiBaseUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments([...documents, data.document]);
        setFileName('');
        setMsg('File uploaded successfully to Supabase Bucket Vault.');
      }
    } catch (err) {
      console.warn('Offline mode: creating mock document metadata.');
      const mockDoc = {
        id: `d-${Date.now()}`,
        projectId: selectedProjectId,
        name: fileName,
        fileUrl: '#',
        fileType,
        uploadedBy: user ? user.fullName : 'Sarah E.'
      };
      setDocuments([...documents, mockDoc]);
      setFileName('');
      setMsg('Offline mode: Document simulated in repository.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Document Vault</h1>
          <p style={{ color: 'var(--text-muted)' }}>Store blueprints, vendor contracts, safety clearances, and bills of quantity securely</p>
        </div>

        <select 
          className="form-select"
          style={{ width: 'auto', minWidth: 240 }}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {msg && (
        <div style={{
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          border: '1px solid rgba(16, 185, 129, 0.15)'
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 32 }}>
        {/* Upload form card */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="card-title"><Upload size={18} /> Upload Document</h3>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label">Document Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Electrical_Plan_Rev2.pdf" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select 
                className="form-select"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
              >
                <option value="application/pdf">PDF Document (*.pdf)</option>
                <option value="image/png">PNG Blueprint Layout (*.png)</option>
                <option value="image/jpeg">JPEG Site Photograph (*.jpg)</option>
                <option value="text/plain">Plain Text Report (*.txt)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: 8 }}
              disabled={uploading}
            >
              {uploading ? 'Processing File...' : 'Secure Upload'}
            </button>
          </form>
        </div>

        {/* Files vault lists */}
        <div className="card">
          <h3 className="card-title"><FolderOpen size={18} /> Safe Files Vault</h3>
          
          {documents.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: 'var(--text-dim)', textAlign: 'center' }}>
              <FileText size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>No documents found for this project. Start by uploading one on the left.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  transition: 'var(--transition-smooth)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden' }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: doc.fileType.includes('pdf') ? 'var(--color-error-bg)' : 'var(--accent-glow)',
                      color: doc.fileType.includes('pdf') ? 'var(--color-error)' : 'var(--accent-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                        Uploaded by: {doc.uploadedBy}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: 6, borderRadius: 8 }} title="Download">
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
