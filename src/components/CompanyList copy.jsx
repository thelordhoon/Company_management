import React from 'react'

export default function CompanyList({
  companySearchTerm,
  setCompanySearchTerm,
  snPartSearchTerm,
  setSnPartSearchTerm,
  showRecentOnly,
  setShowRecentOnly,
  showAddForm,
  setShowAddForm,
  handleAddCompany,
  uploading,
  name,
  setName,
  managers,
  handleManagerChange,
  handleAddManagerField,
  handleRemoveManagerField,
  address,
  setAddress,
  note,
  setNote,
  ink,
  setInk,
  solvent,
  setSolvent,
  isSnSearching,
  filteredAllHistories,
  filteredCompanies,
  companies,
  handleSelectCompany,
  parseManagers
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
    <div>
      {/* 상단 헤더 및 검색바 */}
      <div style={{ background: 'linear-gradient(135deg, #1E60E8 0%, #0093E9 100%)', padding: '24px 20px 28px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer' }}>☰</span>
        </div>
        
        <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800' }}>업체관리</h1>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>안녕하세요, 오늘도 좋은 하루 되세요.</p>

        {/* 검색창 2개 조합 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {/* 업체명/담당자명 검색 */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>🏢</span>
            <input 
              type="text"
              placeholder="업체명, 담당자명 검색..." 
              value={companySearchTerm}
              onChange={(e) => {
                setCompanySearchTerm(e.target.value)
                if (e.target.value) setSnPartSearchTerm('')
              }}
              style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '36px', backgroundColor: '#FFFFFF', border: 'none', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.08)', height: '42px' }}
            />
            {companySearchTerm && (
              <span onClick={() => setCompanySearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>✕</span>
            )}
          </div>

          {/* S/N / 부품명 검색 */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>🔩</span>
            <input 
              type="text"
              placeholder="S/N 또는 사용부품 검색..." 
              value={snPartSearchTerm}
              onChange={(e) => {
                setSnPartSearchTerm(e.target.value)
                if (e.target.value) setCompanySearchTerm('')
              }}
              style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '36px', backgroundColor: '#FFFFFF', border: 'none', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.08)', height: '42px' }}
            />
            {snPartSearchTerm && (
              <span onClick={() => setSnPartSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>✕</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          
          {/* 최근 등록 업체 카드 */}
          <div 
            onClick={() => {
              setShowRecentOnly(!showRecentOnly)
              if (showAddForm) setShowAddForm(false)
            }}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '16px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
              cursor: 'pointer',
              border: showRecentOnly ? '2px solid #2563EB' : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: showRecentOnly ? '#2563EB' : '#EFF6FF', color: showRecentOnly ? 'white' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>🆕</div>
            <div>
              <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '700', display: 'block' }}>최근 등록 업체</span>
              <span style={{ fontSize: '11px', color: showRecentOnly ? '#2563EB' : '#94A3B8', marginTop: '2px', display: 'block', fontWeight: showRecentOnly ? '600' : 'normal' }}>
                {showRecentOnly ? '✓ 상위 5개 보는 중' : '최근 5개 업체 보기'}
              </span>
            </div>
          </div>

          {/* 업체 등록하기 카드 */}
          <div 
            onClick={() => {
              setShowAddForm(!showAddForm)
              if (showRecentOnly) setShowRecentOnly(false)
            }}
            style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', border: showAddForm ? '2px solid #2563EB' : '2px solid transparent' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>➕</div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', display: 'block' }}>업체 등록하기</span>
            <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>새로운 업체를 등록합니다.</span>
          </div>
        </div>

        {/* 신규 업체 등록 폼 */}
        {showAddForm && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1E293B' }}>➕ 신규 업체 등록</h4>
            <form onSubmit={handleAddCompany} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>🏢 업체명*</label>
                <input placeholder="업체명" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, margin: 0 }}>👤 담당자 목록</label>
                  <button type="button" onClick={handleAddManagerField} style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ 담당자 추가</button>
                </div>
                {managers.map((m, idx) => (
                  <div key={idx} style={{ padding: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '8px', position: 'relative' }}>
                    {managers.length > 1 && (
                      <button type="button" onClick={() => handleRemoveManagerField(idx)} style={{ position: 'absolute', right: '8px', top: '8px', border: 'none', background: 'none', color: '#EF4444', fontSize: '14px', cursor: 'pointer' }}>✕</button>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                      <input placeholder="이름 (예: 홍길동)" value={m.name} onChange={(e) => handleManagerChange(idx, 'name', e.target.value)} style={inputStyle} />
                      <input placeholder="부서/직책 (예: 생산팀)" value={m.role} onChange={(e) => handleManagerChange(idx, 'role', e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input placeholder="연락처 (예: 010-1234-5678)" value={m.phone} onChange={(e) => handleManagerChange(idx, 'phone', e.target.value)} style={inputStyle} />
                      <input placeholder="이메일 (예: user@company.com)" value={m.email} onChange={(e) => handleManagerChange(idx, 'email', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label style={labelStyle}>📍 주소</label>
                <input placeholder="주소" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>📌 비고</label>
                <textarea 
                  placeholder="비고 사항을 입력하세요" 
                  rows="3" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>🧪 잉크 품번</label>
                  <input placeholder="예: 70000-00030" value={ink} onChange={(e) => setInk(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>💧 희석제 품번</label>
                  <input placeholder="예: 77001-00030" value={solvent} onChange={(e) => setSolvent(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <button type="submit" disabled={uploading} style={{ padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', marginTop: '4px', cursor: 'pointer' }}>
                {uploading ? '저장 중...' : '등록 완료'}
              </button>
            </form>
          </div>
        )}

        {/* 목록 타이틀 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 12px 4px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
            {isSnSearching 
              ? `📋 서비스 이력 검색 결과 (${filteredAllHistories.length})` 
              : showRecentOnly 
                ? `🆕 최근 등록 업체 (최대 5개)` 
                : `🏢 업체 목록 (${filteredCompanies.length})`}
          </h3>
          {showRecentOnly && (
            <span onClick={() => setShowRecentOnly(false)} style={{ fontSize: '12px', color: '#2563EB', cursor: 'pointer', fontWeight: '600' }}>
              전체 보기 ✕
            </span>
          )}
        </div>

        {/* A. S/N 또는 사용부품 검색 결과 출력 */}
        {isSnSearching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredAllHistories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', backgroundColor: 'white', borderRadius: '16px' }}>
                검색된 서비스 이력이 없습니다.
              </div>
            ) : (
              filteredAllHistories.map((h) => {
                const comp = companies.find(c => c.id === h.company_id)
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
                  <div 
                    key={h.id} 
                    onClick={() => comp && handleSelectCompany(comp)}
                    style={{ 
                      padding: '14px', 
                      borderRadius: '14px', 
                      backgroundColor: 'white', 
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      cursor: comp ? 'pointer' : 'default'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#2563EB' }}>
                        🏢 {comp ? comp.name : '미지정 업체'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        {h.work_date}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>
                      <b>S/N:</b> <span style={{ color: '#0284C7', fontWeight: '600' }}>{h.sn || '없음'}</span>
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>
                      <b>작업내용:</b> {h.work_content || '-'}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                      <b>교체 파트:</b> {parsedParts.length > 0 ? parsedParts.join(', ') : '없음'}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* B. 업체 목록 출력 */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCompanies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', backgroundColor: 'white', borderRadius: '16px' }}>
                등록된 업체가 없습니다.
              </div>
            ) : (
              filteredCompanies.map((c) => {
                const mList = parseManagers(c.manager, c.phone, c.email)
                const displayManager = mList.map(m => m.name ? `${m.name}${m.role ? `(${m.role})` : ''}` : '').filter(Boolean).join(', ') || '미등록'

                return (
                  <div 
                    key={c.id} 
                    onClick={() => handleSelectCompany(c)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '16px', 
                      background: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      border: '1px solid #F1F5F9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏢</div>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ margin: '0 0 4px 0', color: '#1E293B', fontSize: '15px', fontWeight: '700' }}>{c.name}</h4>
                        <span style={{ fontSize: '12px', color: '#64748B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          👤 담당자: <strong style={{ color: '#334155', fontWeight: '600' }}>{displayManager}</strong>
                        </span>
                      </div>
                    </div>
                    <span style={{ color: '#CBD5E1', fontSize: '16px', marginLeft: '8px' }}>›</span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}