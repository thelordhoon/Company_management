import React, { useState } from 'react'

export default function ServiceReportForm({ selectedCompany, partsList = [], onSave, onBack }) {
  // 1. 기본 폼 상태
  const [workDate, setWorkDate] = useState(new Date().toISOString().substring(0, 10))
  const [startHour, setStartHour] = useState('09')
  const [startMin, setStartMin] = useState('00')
  const [endHour, setEndHour] = useState('18')
  const [endMin, setEndMin] = useState('00')
  const [modelName, setModelName] = useState('JET2Neo')
  const [serialNumber, setSerialNumber] = useState('')
  const [workContent, setWorkContent] = useState('')
  const [confirmName, setConfirmName] = useState('박남준')

  // 2. 선택된 담당자 상태
  const [selectedManager, setSelectedManager] = useState('')

  // 3. 동적 사용 부품 상태 (기본 1개 시작)
  const [usedParts, setUsedParts] = useState([
    { part_id: '', name: '', quantity: 1 }
  ])

  // 부품 추가
  const handleAddPart = () => {
    setUsedParts([...usedParts, { part_id: '', name: '', quantity: 1 }])
  }

  // 부품 삭제
  const handleRemovePart = (index) => {
    if (usedParts.length === 1) {
      alert('최소 1개의 부품 항목은 유지되어야 합니다.')
      return
    }
    setUsedParts(usedParts.filter((_, i) => i !== index))
  }

  // 부품 데이터 변경
  const handlePartChange = (index, field, value) => {
    const updated = [...usedParts]
    updated[index][field] = value
    setUsedParts(updated)
  }

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedManager) {
      alert('담당자를 선택해주세요.')
      return
    }

    const reportData = {
      company_id: selectedCompany?.id,
      company_name: selectedCompany?.name,
      manager_name: selectedManager,
      work_date: workDate,
      start_time: `${startHour}:${startMin}`,
      end_time: `${endHour}:${endMin}`,
      model_name: modelName,
      serial_number: serialNumber,
      work_content: workContent,
      used_parts: usedParts,
      confirm_name: confirmName
    }

    if (onSave) {
      onSave(reportData)
    } else {
      console.log('저장 데이터:', reportData)
      alert('서비스 리포트가 저장되었습니다.')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#1E293B'
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', color: '#1E293B' }}>
          ← 뒤로
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>서비스 리포트 작성</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* 작성 메인 카드 */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 1. 선택된 업체명 & 담당자 선택 드롭다운 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>🏢 업체명</label>
            <input 
              type="text" 
              value={selectedCompany?.name || '업체 미선택'} 
              readOnly 
              style={{ ...inputStyle, backgroundColor: '#E2E8F0', color: '#64748B', fontWeight: 'bold' }} 
            />
          </div>
          <div>
            <label style={labelStyle}>👤 담당자 선택*</label>
            <select 
              value={selectedManager} 
              onChange={(e) => setSelectedManager(e.target.value)} 
              style={inputStyle}
              required
            >
              <option value="">담당자 선택</option>
              {selectedCompany?.managers && selectedCompany.managers.length > 0 ? (
                selectedCompany.managers.map((mgr, idx) => (
                  <option key={idx} value={mgr.name || mgr}>
                    {mgr.name ? `${mgr.name} (${mgr.phone || ''})` : mgr}
                  </option>
                ))
              ) : (
                <option value="" disabled>등록된 담당자 없음</option>
              )}
            </select>
          </div>
        </div>

        {/* 2. 작업일자 */}
        <div>
          <label style={labelStyle}>📅 작업일자</label>
          <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} style={inputStyle} />
        </div>

        {/* 3. 시작시간 / 종료시간 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>⏰ 시작시간</label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input type="text" value={startHour} onChange={(e) => setStartHour(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} maxLength={2} />
              <span>:</span>
              <input type="text" value={startMin} onChange={(e) => setStartMin(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} maxLength={2} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>⏰ 종료시간</label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input type="text" value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} maxLength={2} />
              <span>:</span>
              <input type="text" value={endMin} onChange={(e) => setEndMin(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} maxLength={2} />
            </div>
          </div>
        </div>

        {/* 4. 장비 모델명 / 시리얼번호 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>🏷️ 장비 모델명</label>
            <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>🔢 S/N (시리얼번호)</label>
            <input type="text" placeholder="시리얼번호" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* 5. 작업내용 */}
        <div>
          <label style={labelStyle}>🛠️ 작업내용</label>
          <textarea rows="3" placeholder="점검 및 수리 내용 작성" value={workContent} onChange={(e) => setWorkContent(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* 6. 사용 부품 목록 (동적 추가 및 삭제) */}
        <div>
          <label style={labelStyle}>🔧 사용 부품</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {usedParts.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* DB 부품 목록 선택 or 직접 입력 */}
                {partsList.length > 0 ? (
                  <select 
                    value={item.part_id} 
                    onChange={(e) => handlePartChange(index, 'part_id', e.target.value)}
                    style={{ ...inputStyle, flex: 3 }}
                  >
                    <option value="">부품 선택</option>
                    {partsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder={`부품명 또는 품번 (부품 ${index + 1})`}
                    value={item.name} 
                    onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                    style={{ ...inputStyle, flex: 3 }}
                  />
                )}

                <input 
                  type="number" 
                  placeholder="수량" 
                  min="1"
                  value={item.quantity} 
                  onChange={(e) => handlePartChange(index, 'quantity', Number(e.target.value))}
                  style={{ ...inputStyle, flex: 1, textAlign: 'center' }}
                />

                {usedParts.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemovePart(index)}
                    style={{ padding: '10px 12px', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleAddPart}
            style={{ width: '100%', marginTop: '8px', padding: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px dashed #2563EB', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
          >
            + 부품 추가
          </button>
        </div>

        {/* 7. 확인자 성명 */}
        <div>
          <label style={labelStyle}>✍️ 확인자 성명</label>
          <input type="text" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} style={inputStyle} />
        </div>

        {/* 저장 버튼 */}
        <button 
          type="submit" 
          style={{ width: '100%', padding: '14px', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}
        >
          서비스 리포트 저장
        </button>

      </form>
    </div>
  )
}