import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import SignatureCanvas from 'react-signature-canvas'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [companies, setCompanies] = useState([])
  const [allHistories, setAllHistories] = useState([]) // 전체 서비스 이력 저장
  
  // 메인 검색 상태
  const [companySearchTerm, setCompanySearchTerm] = useState('') // 업체명/담당자명 검색
  const [snPartSearchTerm, setSnPartSearchTerm] = useState('') // S/N / 부품명 검색

  // 상세보기 내 S/N 검색 상태
  const [detailSnSearchTerm, setDetailSnSearchTerm] = useState('')

  const [viewMode, setViewMode] = useState('list') // 'list', 'detail', 'report'
  const [selectedCompany, setSelectedCompany] = useState(null)

  // 업체 정보 수정 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ 
    name: '', 
    managers: [{ name: '', phone: '', role: '', email: '' }], 
    address: '',
    ink: '',
    solvent: ''
  })

  // 신규 업체 입력 상태
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [managers, setManagers] = useState([{ name: '', phone: '', role: '', email: '' }])
  const [address, setAddress] = useState('')
  const [ink, setInk] = useState('')
  const [solvent, setSolvent] = useState('')

  // 서비스 리포트 폼 상태
  const [workDate, setWorkDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })
  const [startHour, setStartHour] = useState('09')
  const [startMin, setStartMin] = useState('00')
  const [endHour, setEndHour] = useState('18')
  const [endMin, setEndMin] = useState('00')
  const [sn, setSn] = useState('')
  const [modelName, setModelName] = useState('JET2Neo')
  const [workContent, setWorkContent] = useState('')
  const [parts, setParts] = useState(['', ''])
  const [confirmor, setConfirmor] = useState('')

  const [historyList, setHistoryList] = useState([])
  const [uploading, setUploading] = useState(false)

  const sigCanvas = useRef({})

  useEffect(() => {
    fetchCompanies()
    fetchAllServiceHistories()
  }, [])

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true })
    if (!error) setCompanies(data || [])
  }

  // 메인 통합 검색용 전체 서비스 이력 조회
  const fetchAllServiceHistories = async () => {
    const { data, error } = await supabase
      .from('service_history')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) setAllHistories(data || [])
  }

  // 담당자 목록 파싱 도우미 (이메일 호환 추가)
  const parseManagers = (managerData, phoneData, defaultEmail) => {
    if (!managerData) return [{ name: '', phone: '', role: '', email: defaultEmail || '' }]
    
    try {
      const parsed = typeof managerData === 'string' ? JSON.parse(managerData) : managerData
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(m => ({
          name: m.name || '',
          phone: m.phone || '',
          role: m.role || '',
          email: m.email || ''
        }))
      }
    } catch (e) {
      // 기존 문자열 호환
    }

    return [{ name: managerData || '', phone: phoneData || '', role: '', email: defaultEmail || '' }]
  }

  const handleAddManagerField = () => {
    setManagers([...managers, { name: '', phone: '', role: '', email: '' }])
  }

  const handleRemoveManagerField = (index) => {
    if (managers.length === 1) return
    setManagers(managers.filter((_, i) => i !== index))
  }

  const handleManagerChange = (index, field, value) => {
    const newManagers = [...managers]
    newManagers[index][field] = value
    setManagers(newManagers)
  }

  const handleEditAddManagerField = () => {
    setEditData({ ...editData, managers: [...editData.managers, { name: '', phone: '', role: '', email: '' }] })
  }

  const handleEditRemoveManagerField = (index) => {
    if (editData.managers.length === 1) return
    setEditData({ ...editData, managers: editData.managers.filter((_, i) => i !== index) })
  }

  const handleEditManagerChange = (index, field, value) => {
    const newManagers = [...editData.managers]
    newManagers[index][field] = value
    setEditData({ ...editData, managers: newManagers })
  }

  const handleAddCompany = async (e) => {
    e.preventDefault()
    if (!name) return alert('업체명을 입력해주세요!')

    setUploading(true)
    const primaryPhone = managers[0]?.phone || ''
    const primaryEmail = managers[0]?.email || ''

    const { error } = await supabase
      .from('companies')
      .insert([{ 
        name, 
        manager: JSON.stringify(managers),
        phone: primaryPhone,
        email: primaryEmail,
        address, 
        ink,
        solvent
      }])

    setUploading(false)

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      alert('업체가 등록되었습니다.')
      setName(''); setAddress(''); setInk(''); setSolvent('');
      setManagers([{ name: '', phone: '', role: '', email: '' }])
      setShowAddForm(false)
      fetchCompanies()
    }
  }

  const fetchServiceHistory = async (companyId) => {
    const { data, error } = await supabase
      .from('service_history')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (!error) setHistoryList(data || [])
  }

  const handleSelectCompany = async (company) => {
    const parsedManagers = parseManagers(company.manager, company.phone, company.email)
    setSelectedCompany({ ...company, managersList: parsedManagers })
    setConfirmor(parsedManagers[0]?.name || '')
    setIsEditing(false)
    setDetailSnSearchTerm('')
    setEditData({
      name: company.name || '',
      managers: parsedManagers,
      address: company.address || '',
      ink: company.ink || '',
      solvent: company.solvent || ''
    })
    setViewMode('detail')
    fetchServiceHistory(company.id)
  }

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleSaveCompanyEdit = async () => {
    if (!editData.name.trim()) return alert('업체명을 입력해주세요.')

    setUploading(true)
    const primaryPhone = editData.managers[0]?.phone || ''
    const primaryEmail = editData.managers[0]?.email || ''

    const { data, error } = await supabase
      .from('companies')
      .update({
        name: editData.name,
        manager: JSON.stringify(editData.managers),
        phone: primaryPhone,
        email: primaryEmail,
        address: editData.address,
        ink: editData.ink,
        solvent: editData.solvent
      })
      .eq('id', selectedCompany.id)
      .select()

    setUploading(false)

    if (error) {
      alert('수정 실패: ' + error.message)
    } else {
      alert('업체 정보가 수정되었습니다.')
      const updated = data && data.length > 0 ? data[0] : { ...selectedCompany, ...editData }
      const updatedManagers = parseManagers(updated.manager, updated.phone, updated.email)
      setSelectedCompany({ ...updated, managersList: updatedManagers })
      setIsEditing(false)
      fetchCompanies()
    }
  }

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('해당 업체의 모든 서비스 이력과 정보가 삭제됩니다. 정말 삭제하시겠습니까?')) return
    
    await supabase.from('service_history').delete().eq('company_id', id)
    const { error } = await supabase.from('companies').delete().eq('id', id)
    
    if (!error) {
      alert('삭제되었습니다.')
      setViewMode('list')
      setSelectedCompany(null)
      fetchCompanies()
      fetchAllServiceHistories()
    } else {
      alert('삭제 실패: ' + error.message)
    }
  }

  const handleDeleteHistoryItem = async (historyId) => {
    if (!window.confirm('선택한 서비스 이력을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('service_history')
      .delete()
      .eq('id', historyId)

    if (error) {
      alert('삭제 실패: ' + error.message)
    } else {
      alert('서비스 이력이 삭제되었습니다.')
      fetchAllServiceHistories()
      if (selectedCompany) {
        fetchServiceHistory(selectedCompany.id)
      }
    }
  }

  const clearSignature = () => {
    if (sigCanvas.current && sigCanvas.current.clear) {
      sigCanvas.current.clear()
    }
  }

  const handleSaveReport = async (e) => {
    e.preventDefault()
    if (!selectedCompany) return

    setUploading(true)

    try {
      const { error } = await supabase
        .from('service_history')
        .insert([{ 
          company_id: selectedCompany.id, 
          work_date: workDate,
          start_time: `${startHour}:${startMin}`,
          end_time: `${endHour}:${endMin}`,
          sn,
          model_name: modelName,
          work_content: workContent,
          parts: JSON.stringify(parts),
          confirmor
        }])

      if (error) {
        alert('리포트 저장 실패: ' + error.message)
      } else {
        alert('서비스 리포트가 성공적으로 저장되었습니다!')
        setWorkContent('')
        setSn('')
        setParts(['', ''])
        clearSignature()
        fetchAllServiceHistories()
        handleSelectCompany(selectedCompany)
      }
    } catch (err) {
      alert('저장 중 알 수 없는 오류가 발생했습니다: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // 1) 업체 필터링
  const filteredCompanies = companySearchTerm.trim() === '' 
    ? companies 
    : companies.filter(c => 
        (c.name && c.name.toLowerCase().includes(companySearchTerm.toLowerCase())) ||
        (c.manager && c.manager.toLowerCase().includes(companySearchTerm.toLowerCase()))
      )

  // 2) S/N 및 사용부품 검색어 기준 서비스 이력 필터링
  const isSnSearching = snPartSearchTerm.trim() !== ''
  const filteredAllHistories = !isSnSearching ? [] : allHistories.filter(h => {
    const term = snPartSearchTerm.toLowerCase()
    const snMatch = h.sn && h.sn.toLowerCase().includes(term)
    const partsMatch = h.parts && h.parts.toLowerCase().includes(term)
    return snMatch || partsMatch
  })

  // 상세 페이지 내 S/N 필터링
  const filteredDetailHistory = detailSnSearchTerm.trim() === ''
    ? historyList
    : historyList.filter(h => h.sn && h.sn.toLowerCase().includes(detailSnSearchTerm.toLowerCase()))

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
    <div style={{ backgroundColor: '#F4F7FB', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '480px', margin: '0 auto', position: 'relative', paddingBottom: '24px', boxSizing: 'border-box' }}>
      
      {/* 1. 메인 목록 화면 */}
      {viewMode === 'list' && (
        <div>
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
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>🏢</div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', display: 'block' }}>전체 업체 수</span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{companies.length}</span>
                </div>
              </div>

              <div 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', border: showAddForm ? '1px solid #2563EB' : '1px solid transparent' }}
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
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px 4px' }}>
              {isSnSearching ? `📋 서비스 이력 검색 결과 (${filteredAllHistories.length})` : '🏢 업체 목록'}
            </h3>

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
              /* B. 기존 업체 목록 출력 */
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
      )}

      {/* 2. 업체 상세 화면 */}
      {viewMode === 'detail' && selectedCompany && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <button onClick={() => setViewMode('list')} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#1E293B', fontWeight: '600' }}>← 뒤로</button>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A' }}>{isEditing ? '업체 정보 수정' : '업체 상세'}</h3>
            <div style={{ width: '24px' }}></div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px' }}>
            {!isEditing ? (
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

          {/* 최근 서비스 이력 목록 */}
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
      )}

      {/* 3. 서비스 리포트 작성 화면 */}
      {viewMode === 'report' && selectedCompany && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <button onClick={() => setViewMode('detail')} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#1E293B', fontWeight: '600' }}>← 뒤로</button>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A' }}>서비스 리포트 작성</h3>
            <div style={{ width: '24px' }}></div>
          </div>

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
                  <input value={selectedCompany.name} readOnly style={{ ...inputStyle, backgroundColor: '#E2E8F0', fontWeight: '600' }} />
                </div>
                <div>
                  <label style={labelStyle}>👤 담당자 선택</label>
                  <select value={confirmor} onChange={(e) => setConfirmor(e.target.value)} style={inputStyle}>
                    {selectedCompany.managersList && selectedCompany.managersList.map((m, i) => (
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
      )}

    </div>
  )
}

export default App