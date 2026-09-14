import React from 'react'

export default function CompanyDetail({
  setViewMode,
  isEditing,
  setIsEditing,
  selectedCompany,
  handleStartEdit,
  handleDeleteCompany,
  editData,
  setEditData,
  handleEditAddManagerField,
  handleEditRemoveManagerField,
  handleEditManagerChange,
  handleSaveCompanyEdit,
  uploading,
  detailSnSearchTerm,
  setDetailSnSearchTerm,
  filteredDetailHistory,
  handleDeleteHistoryItem,
  estimates = [] // 견적서 데이터 (기본값 설정으로 에러 방지)
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
      {/* 상단 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
        <button onClick={() => setViewMode('list')} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#1E293B', fontWeight: '600' }}>← 뒤로</button>
        <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A' }}>업체 상세 정보</h3>
        <button onClick={() => handleDeleteCompany(selectedCompany.id)} style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>삭제</button>
      </div>

      {/* 업체 정보 카드 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px' }}>
        {!isEditing ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>{selectedCompany.name}</h2>
              <button onClick={handleStartEdit} style={{ border: 'none', background: '#E0F2FE', color: '#0284C7', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>수정</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#334155' }}>
              <div><strong>📍 주소:</strong> {selectedCompany.address || '-'}</div>
              <div><strong>🖨️ 잉크/희석제:</strong> {selectedCompany.ink || '-'} / {selectedCompany.solvent || '-'}</div>
              
              <div style={{ marginTop: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>👤 담당자 목록:</strong>
                {selectedCompany.managersList && selectedCompany.managersList.map((m, idx) => (
                  <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', marginBottom: '4px', fontSize: '13px' }}>
                    <div><strong>{m.name || '이름 없음'}</strong> {m.role ? `(${m.role})` : ''}</div>
                    <div style={{ color: '#64748B', fontSize: '12px' }}>📞 {m.phone || '-'} | ✉️ {m.email || '-'}</div>
                  </div>
                ))}
              </div>

              {selectedCompany.card_url && (
                <div style={{ marginTop: '4px' }}>
                  <strong>📝 비고:</strong> {selectedCompany.card_url}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 수정 폼 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>업체명</label>
              <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>주소</label>
              <input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>잉크</label>
                <input value={editData.ink} onChange={(e) => setEditData({ ...editData, ink: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>희석제</label>
                <input value={editData.solvent} onChange={(e) => setEditData({ ...editData, solvent: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={labelStyle}>담당자 목록</label>
                <button type="button" onClick={handleEditAddManagerField} style={{ border: 'none', background: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>+ 담당자 추가</button>
              </div>
              {editData.managers.map((m, idx) => (
                <div key={idx} style={{ border: '1px solid #E2E8F0', padding: '8px', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#F8FAFC' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    <input placeholder="이름" value={m.name} onChange={(e) => handleEditManagerChange(idx, 'name', e.target.value)} style={inputStyle} />
                    <input placeholder="직급/역할" value={m.role} onChange={(e) => handleEditManagerChange(idx, 'role', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input placeholder="전화번호" value={m.phone} onChange={(e) => handleEditManagerChange(idx, 'phone', e.target.value)} style={inputStyle} />
                    <input placeholder="이메일" value={m.email} onChange={(e) => handleEditManagerChange(idx, 'email', e.target.value)} style={inputStyle} />
                  </div>
                  {editData.managers.length > 1 && (
                    <button type="button" onClick={() => handleEditRemoveManagerField(idx)} style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginTop: '6px', cursor: 'pointer' }}>삭제</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={handleSaveCompanyEdit} disabled={uploading} style={{ flex: 1, padding: '10px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>저장</button>
              <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '10px', background: '#94A3B8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>취소</button>
            </div>
          </div>
        )}
      </div>

      {/* 작업 버튼 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => setViewMode('report')} style={{ padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}>
          + 서비스 리포트 작성
        </button>
        <button onClick={() => setViewMode('estimate')} style={{ padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.2)' }}>
          + 견적서 작성
        </button>
      </div>

      {/* 서비스 이력 검색 및 목록 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#0F172A' }}>📋 서비스 이력 ({filteredDetailHistory.length})</h4>
          <input 
            placeholder="S/N 검색..." 
            value={detailSnSearchTerm} 
            onChange={(e) => setDetailSnSearchTerm(e.target.value)}
            style={{ width: '120px', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E2E8F0', outline: 'none' }}
          />
        </div>

        {filteredDetailHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: '13px' }}>등록된 서비스 이력이 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredDetailHistory.map((item) => (
              <div key={item.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>📅 {item.work_date} ({item.start_time}~{item.end_time})</span>
                  <button onClick={() => handleDeleteHistoryItem(item.id)} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: '11px', cursor: 'pointer' }}>삭제</button>
                </div>
                <div style={{ fontSize: '13px', color: '#1E293B', marginBottom: '4px' }}>
                  <strong>모델:</strong> {item.model_name || '-'} | <strong>S/N:</strong> {item.sn || '-'}
                </div>
                <div style={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-line', marginBottom: '6px' }}>
                  <strong>작업내용:</strong> {item.work_content}
                </div>
                {item.parts && item.parts !== '["",""]' && (
                  <div style={{ fontSize: '12px', color: '#0284C7', backgroundColor: '#E0F2FE', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    🔧 부품: {typeof item.parts === 'string' ? item.parts.replace(/[\[\]"]/g, '') : item.parts.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}