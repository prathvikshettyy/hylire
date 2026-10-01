import React, { useState, useEffect } from 'react';
import { X, DollarSign, Receipt, PlusCircle, CheckCircle2, AlertTriangle, Calendar, Layers } from 'lucide-react';
import { localProjects } from '../utils/localStore';

const SpentBreakdownModal = ({ project, onClose, onExpenseAdded }) => {
  if (!project) return null;

  const projectId = project.id || project._id;
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Materials');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseSuccess, setExpenseSuccess] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Compute live spent details
  const modalDetails = localProjects.getSpentDetails(projectId);
  const isOver = modalDetails.spent > modalDetails.allocated && modalDetails.allocated > 0;
  const progressPercent = modalDetails.percent;

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount) || 0;
    if (amt <= 0) return;

    localProjects.recordExpense(projectId, {
      amount: amt,
      category: expenseCategory,
      description: expenseDesc || `${expenseCategory} expenditure`,
      vendor: expenseVendor || 'Site Field Voucher'
    });

    setExpenseSuccess(`Recorded ₹${amt.toLocaleString('en-IN')} under ${expenseCategory} successfully!`);
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseVendor('');

    if (onExpenseAdded) {
      onExpenseAdded();
    }

    setTimeout(() => {
      setExpenseSuccess('');
    }, 3500);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--modal-overlay, rgba(15, 23, 42, 0.75))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 9999
      }}
    >
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        maxWidth: 800,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 28,
        position: 'relative',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--line)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Receipt size={24} style={{ color: 'var(--primary-color)' }} />
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: 'var(--ink)',
                margin: 0
              }}>
                {project.name}
              </h2>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
              Detailed budget expenditure, category allocation & itemized transactions
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--soft)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--ink)',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* High-Level Financial Snapshot */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}>
          <div style={{ backgroundColor: 'var(--soft)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>Allocated Budget</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
              ₹{modalDetails.allocated.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--soft)',
            padding: 14,
            borderRadius: 10,
            border: `1px solid ${isOver ? 'var(--danger)' : 'var(--line)'}`
          }}>
            <span style={{ fontSize: 13, color: isOver ? 'var(--danger)' : 'var(--muted)', fontWeight: 600, display: 'block' }}>
              Total Budget Spent
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: isOver ? 'var(--danger)' : 'var(--ink)' }}>
              ₹{modalDetails.spent.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--soft)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>Remaining Balance</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: isOver ? 'var(--danger)' : 'var(--success)' }}>
              ₹{modalDetails.remaining.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--soft)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>Budget Utilized</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: isOver ? 'var(--danger)' : 'var(--ink)' }}>
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: 'var(--ink)' }}>EXPENDITURE RATIO</span>
            <span style={{ color: isOver ? 'var(--danger)' : 'var(--muted)' }}>
              {isOver ? `Exceeded budget by ₹${(modalDetails.spent - modalDetails.allocated).toLocaleString('en-IN')}` : `${progressPercent}% of capital deployed`}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 12,
            backgroundColor: 'var(--soft)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            {isOver ? (
              <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                <div style={{ width: '70%', height: '100%', backgroundColor: 'var(--info)' }} />
                <div className="hazard-stripe" style={{ width: '30%', height: '100%' }} />
              </div>
            ) : (
              <div style={{
                width: `${Math.min(100, progressPercent)}%`,
                height: '100%',
                backgroundColor: progressPercent > 85 ? 'var(--warning)' : 'var(--success)',
                transition: 'width 0.4s ease'
              }} />
            )}
          </div>
        </div>

        {/* Itemized Category Summary */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink)',
            margin: '0 0 10px 0'
          }}>
            Expenditure by Category
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--soft)', borderRadius: 8, border: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>Materials & Concrete</span>
              <strong style={{ color: 'var(--ink)', fontSize: 14 }}>₹{modalDetails.materialsTotal.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--soft)', borderRadius: 8, border: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>Brickwork & Masonry</span>
              <strong style={{ color: 'var(--ink)', fontSize: 14 }}>₹{modalDetails.bricksTotal.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--soft)', borderRadius: 8, border: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>Labor & Operations</span>
              <strong style={{ color: 'var(--ink)', fontSize: 14 }}>₹{modalDetails.costsTotal.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--soft)', borderRadius: 8, border: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>Site Expenses & Vouchers</span>
              <strong style={{ color: 'var(--ink)', fontSize: 14 }}>₹{modalDetails.manualSpent.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Transactions & Itemized Log */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink)',
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Layers size={18} /> Detailed Line Item Transactions
          </h3>

          <div style={{
            backgroundColor: 'var(--soft)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            {modalDetails.items && modalDetails.items.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ink)' }}>Date</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ink)' }}>Category</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ink)' }}>Item / Description</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDetails.items.map((item, idx) => (
                      <tr 
                        key={item.id || idx} 
                        style={{ 
                          borderBottom: idx < modalDetails.items.length - 1 ? '1px solid var(--line)' : 'none',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--panel)',
                            color: 'var(--ink)',
                            display: 'inline-block'
                          }}>
                            {item.category || item.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong style={{ display: 'block', color: 'var(--ink)', fontSize: 13 }}>{item.name}</strong>
                          {item.desc && <span style={{ color: 'var(--muted)', fontSize: 12 }}>{item.desc}</span>}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                No itemized transactions recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Record New Expense Form */}
        <div style={{
          backgroundColor: 'var(--soft)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: 18
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 0 12px 0'
          }}>
            <DollarSign size={18} /> Record New Project Expense
          </h3>

          {expenseSuccess && (
            <div style={{
              backgroundColor: 'var(--panel)',
              color: 'var(--success)',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--success)',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <CheckCircle2 size={16} />
              <span>{expenseSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                  Expense Amount (₹) *
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 75000" 
                  value={expenseAmount} 
                  onChange={(e) => setExpenseAmount(e.target.value)} 
                  required 
                  min="1"
                  style={{
                    width: '100%',
                    height: 44,
                    fontSize: 14,
                    padding: '0 12px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                  Category *
                </label>
                <select 
                  className="form-select"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  style={{
                    width: '100%',
                    height: 44,
                    fontSize: 14,
                    padding: '0 12px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 8
                  }}
                >
                  <option value="Materials">Materials & Concrete</option>
                  <option value="Labor">Labor & Wages</option>
                  <option value="Equipment">Heavy Equipment & Machinery</option>
                  <option value="Permits">Permits & Municipal NOC</option>
                  <option value="Subcontractors">Subcontractors</option>
                  <option value="Fuel/Transport">Fuel & Transportation</option>
                  <option value="Misc">Miscellaneous</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                  Description / Note
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 50 bags OPC Cement from local distributor" 
                  value={expenseDesc} 
                  onChange={(e) => setExpenseDesc(e.target.value)} 
                  style={{
                    width: '100%',
                    height: 44,
                    fontSize: 14,
                    padding: '0 12px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 8
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                  Vendor / Contractor
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sharma Hardware & Building Material" 
                  value={expenseVendor} 
                  onChange={(e) => setExpenseVendor(e.target.value)} 
                  style={{
                    width: '100%',
                    height: 44,
                    fontSize: 14,
                    padding: '0 12px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 8
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{
                minHeight: 44,
                fontSize: 14,
                fontWeight: 700,
                marginTop: 4,
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 8
              }}
            >
              <PlusCircle size={18} />
              <span>Add Expense to Project</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SpentBreakdownModal;
