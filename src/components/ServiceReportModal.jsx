import React from 'react'
import SignatureCanvas from 'react-signature-canvas'

export default function ServiceReportModal({
  setViewMode,
  handleSaveReport,
  uploading,
  workDate,
  setWorkDate,
  startHour,
  setStartHour,
  startMin,
  setStartMin,
  endHour,
  setEndHour,
  endMin,
  setEndMin,
  selectedCompany,
  confirmor,
  setConfirmor,
  modelName,
  setModelName,
  sn,
  setSn,
  workContent,
  setWorkContent,
  parts,
  setParts,
  clearSignature,
  sigCanvas
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
        <button onClick={() => setViewMode('detail')} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#1E293B', fontWeight: '600' }}>← 뒤로</button>
        <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A' }}>서비스 리포트 작성</h3>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* 리포트 폼 */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSaveReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>📅 작업일자</label>
            <input type="text" value={workDate} onChange={(e) => setWorkDate(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>⏰ 시작시간</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input value={startHour} onChange={(e) => setStartHour(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /> :
                <input value={startMin} onChange={(e) => setStartMin(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>⏰ 종료시간</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /> :
                <input value={endMin} onChange={(e) => setEndMin(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '8px' }}>
            <div>
              <label style={labelStyle}>🏢 업체명</label>
              <input value={selectedCompany?.name || ''} readOnly style={{ ...inputStyle, backgroundColor: '#E2E8F0', fontWeight: '600' }} />
            </div>
            <div>
              <label style={labelStyle}>👤 담당자 선택</label>
              <select value={confirmor} onChange={(e) => setConfirmor(e.target.value)} style={inputStyle}>
                {selectedCompany?.managersList && selectedCompany.managersList.map((m, i) => (
                  <option key={i} value={m.name}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>🏷️ 모델명</label>
              <select value={modelName} onChange={(e) => setModelName(e.target.value)} style={inputStyle}>
                <option value="JET2Neo">JET2Neo</option>
                <option value="JET3Up">JET3Up</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>🔢 S/N</label>
              <input value={sn} onChange={(e) => setSn(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>📝 작업내용</label>
            <textarea rows="3" value={workContent} onChange={(e) => setWorkContent(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>🔧 사용 부품 (최대 2개)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              {parts.map((p, idx) => (
                <input 
                  key={idx} 
                  placeholder={`부품 ${idx + 1}`}
                  value={p} 
                  onChange={(e) => {
                    const newParts = [...parts]
                    newParts[idx] = e.target.value
                    setParts(newParts)
                  }} 
                  style={inputStyle}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>👤 확인자</label>
              <input value={confirmor} onChange={(e) => setConfirmor(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ ...labelStyle, margin: 0 }}>✍️ 서명</label>
                <button type="button" onClick={clearSignature} style={{ border: 'none', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>지우기</button>
              </div>
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', backgroundColor: '#FFFFFF', touchAction: 'none' }}>
                <SignatureCanvas 
                  ref={sigCanvas} 
                  penColor="black"
                  canvasProps={{ width: 180, height: 75, className: 'sigCanvas' }} 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={uploading} style={{ width: '100%', padding: '14px', background: uploading ? '#94A3B8' : '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', marginTop: '10px', cursor: 'pointer' }}>
            {uploading ? '저장 중...' : '서비스 리포트 저장'}
          </button>
        </form>
      </div>
    </div>
  )
}