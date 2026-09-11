import React from 'react'

export default function CompanyDetail({
  setViewMode,
  selectedCompany,
  isEditing,
  setIsEditing,
  editData,
  setEditData,
  handleEditAddManagerField,
  handleEditRemoveManagerField,
  handleEditManagerChange,
  handleStartEdit,
  handleSaveCompanyEdit,
  handleDeleteCompany,
  handleDeleteHistoryItem,
  uploading,
  detailSnSearchTerm,
  setDetailSnSearchTerm,
  filteredDetailHistory
}) {
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#1E293B'
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '4px',
    display: 'block'
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* 상단 뒤로가기 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
        <button onClick={() => setViewMode('list')} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#1E293B', fontWeight: '600' }}>← 뒤로</button>
        <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A' }}>{isEditing ? '업체 정보 수정' : '업체 상세'}</h3>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* 업체 카드 영역 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px' }}>
        {!isEditing ? (
          /* A. 업체 상세 조회 모드 */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏢</div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1E293B' }}>{selectedCompany.name}</h3>
              </div>
              <button 
                onClick={() => setViewMode('report')}
                style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#2563EB', border: 'none', color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                📄
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>👤 담당자 목록</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCompany.managersList && selectedCompany.managersList.length > 0 ? (
                    selectedCompany.managersList.map((m, idx) => (
                      <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontWeight: '600', color: '#1E293B' }}>{m.name || '미입력'}</span>
                            {m.role && <span style={{ fontSize: '12px', color: '#2563EB', marginLeft: '6px' }}>({m.role})</span>}
                          </div>
                          <span style={{ color: '#475569', fontSize: '13px', fontWeight: '500' }}>📞 {m.phone || '-'}</span>
                        </div>
                        {m.email && (
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            ✉️ {m.email}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#94A3B8' }}>등록된 담당자가 없습니다.</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: '#64748B' }}>📍 주소</span>
                <span style={{ fontWeight: '500', color: '#1E293B', textAlign: 'right', maxWidth: '60%' }}>{selectedCompany.address || '-'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '600' }}>📌 비고</span>
                <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F1F5F9', color: '#334155', whiteSpace: 'pre-wrap', minHeight: '38px', fontSize: '13px' }}>
                  {selectedCompany.card_url || <span style={{ color: '#94A3B8' }}>등록된 비고 사항이 없습니다.</span>}
                </div>
              </div>

              <div style={{ backgroundColor: '#EFF6FF', padding: '12px', borderRadius: '10px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#1E40AF', fontWeight: '600' }}>🧪 잉크:</span>
                  <span style={{ fontWeight: '700', color: '#1E3A8A' }}>{selectedCompany.ink || '미등록'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#1E40AF', fontWeight: '600' }}>💧 희석제:</span>
                  <span style={{ fontWeight: '700', color: '#1E3A8A' }}>{selectedCompany.solvent || '미등록'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleStartEdit} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #2563EB', background: 'white', color: '#2563EB', fontWeight: '600', cursor: 'pointer' }}>수정</button>
              <button onClick={() => handleDeleteCompany(selectedCompany.id)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #EF4444', background: 'white', color: '#EF4444', fontWeight: '600', cursor: 'pointer' }}>삭제</button>
            </div>
          </>
        ) : (
          /* B. 업체 정보 수정 모드 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>🏢 업체명*</label>
              <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, margin: 0 }}>👤 담당자 목록</label>
                <button type="button" onClick={handleEditAddManagerField} style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ 담당자 추가</button>
              </div>
              {editData.managers.map((m, idx) => (
                <div key={idx} style={{ padding: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '8px', position: 'relative' }}>
                  {editData.managers.length > 1 && (
                    <button type="button" onClick={() => handleEditRemoveManagerField(idx)} style={{ position: 'absolute', right: '8px', top: '8px', border: 'none', background: 'none', color: '#EF4444', fontSize: '14px', cursor: 'pointer' }}>✕</button>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    <input placeholder="이름" value={m.name} onChange={(e) => handleEditManagerChange(idx, 'name', e.target.value)} style={inputStyle} />
                    <input placeholder="부서/직책" value={m.role} onChange={(e) => handleEditManagerChange(idx, 'role', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input placeholder="연락처" value={m.phone} onChange={(e) => handleEditManagerChange(idx, 'phone', e.target.value)} style={inputStyle} />
                    <input placeholder="이메일" value={m.email} onChange={(e) => handleEditManagerChange(idx, 'email', e.target.value)} style={inputStyle} />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label style={labelStyle}>📍 주소</label>
              <input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>📌 비고</label>
              <textarea 
                rows="3" 
                placeholder="비고 사항을 입력하세요"
                value={editData.note} 
                onChange={(e) => setEditData({ ...editData, note: e.target.value })} 
                style={inputStyle} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>🧪 잉크</label>
                <input value={editData.ink} onChange={(e) => setEditData({ ...editData, ink: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>💧 희석제</label>
                <input value={editData.solvent} onChange={(e) => setEditData({ ...editData, solvent: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #94A3B8', background: 'white', color: '#64748B', fontWeight: '600', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSaveCompanyEdit} disabled={uploading} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: '#2563EB', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                {uploading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 최근 서비스 이력 목록 영역 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ margin: 0, color: '#1E293B', fontSize: '15px' }}>
            📋 최근 서비스 이력 ({filteredDetailHistory.length})
          </h4>
          <div style={{ position: 'relative', width: '140px' }}>
            <input 
              type="text" 
              placeholder="S/N 검색..." 
              value={detailSnSearchTerm}
              onChange={(e) => setDetailSnSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 26px 6px 10px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {detailSnSearchTerm ? (
              <span onClick={() => setDetailSnSearchTerm('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94A3B8', cursor: 'pointer' }}>✕</span>
            ) : (
              <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94A3B8' }}>🔍</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredDetailHistory.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', margin: '10px 0' }}>
              {detailSnSearchTerm ? '검색된 S/N 이력이 없습니다.' : '등록된 서비스 이력이 없습니다.'}
            </p>
          ) : (
            filteredDetailHistory.map((h) => {
              let parsedParts = []
              try {
                if (h.parts) {
                  const temp = typeof h.parts === 'string' ? JSON.parse(h.parts) : h.parts
                  parsedParts = Array.isArray(temp) ? temp.filter(p => p && p.trim() !== '') : []
                }
              } catch (e) {
                parsedParts = []
              }

              return (
                <div key={h.id} style={{ border: '1px solid #F1F5F9', padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '600' }}>
                      {h.work_date} ({h.start_time} ~ {h.end_time})
                    </span>
                    <button 
                      onClick={() => handleDeleteHistoryItem(h.id)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 4px', color: '#EF4444' }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>
                    <b>S/N:</b> {h.sn || '없음'}
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>
                    <b>작업:</b> {h.work_content || '-'}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                    <b>교체 파트:</b> {parsedParts.length > 0 ? parsedParts.join(', ') : '없음'}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}