import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import SignatureCanvas from 'react-signature-canvas'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [companies, setCompanies] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list', 'detail', 'report'
  const [selectedCompany, setSelectedCompany] = useState(null)

  // 신규 업체 입력 상태
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [manager, setManager] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')

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
  }, [])

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true })
    if (!error) setCompanies(data || [])
  }

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const uploadFile = async (file) => {
    if (!file) return null
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('business-cards')
      .upload(fileName, file)

    if (uploadError) return null

    const { data } = supabase.storage
      .from('business-cards')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  const handleAddCompany = async (e) => {
    e.preventDefault()
    if (!name) return alert('업체명을 입력해주세요!')

    setUploading(true)
    const { error } = await supabase
      .from('companies')
      .insert([{ 
        name, phone, manager, address, email 
      }])

    setUploading(false)

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      alert('업체가 등록되었습니다.')
      setName(''); setPhone(''); setManager(''); setAddress(''); setEmail('');
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
    setSelectedCompany(company)
    setConfirmor(company.manager || '')
    setViewMode('detail')
    fetchServiceHistory(company.id)
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
    } else {
      alert('삭제 실패: ' + error.message)
    }
  }

  // 개별 서비스 이력 삭제 함수
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
    let signatureUrl = ''

    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const sigData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      const sigFile = dataURLtoFile(sigData, 'signature.png')
      signatureUrl = await uploadFile(sigFile)
    }

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
        confirmor,
        signature_url: signatureUrl
      }])

    setUploading(false)

    if (error) {
      alert('리포트 저장 실패: ' + error.message)
    } else {
      alert('서비스 리포트가 저장되었습니다!')
      setWorkContent('')
      setParts(['', ''])
      clearSignature()
      handleSelectCompany(selectedCompany)
    }
  }

  const filteredCompanies = searchTerm.trim() === '' 
    ? companies 
    : companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
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
    <div style={{ backgroundColor: '#F1F5F9', minHeight: '100vh', padding: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '480px', margin: '0 auto' }}>
      
      {/* 1. 목록 화면 */}
      {viewMode === 'list' && (
        <div>
          {/* 상단 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 0 16px' }}>
            <span style={{ fontSize: '20px' }}>📱</span>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: 0 }}>(주)메이쓰 현장 관리</h2>
          </div>

          {/* 검색창 */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>🔍</span>
            <input 
              type="text"
              placeholder="업체명 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '40px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            />
          </div>

          {/* 신규 업체 등록 토글 */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
            <div 
              onClick={() => setShowAddForm(!showAddForm)} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#2563EB', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}
            >
              <span>{showAddForm ? '▲' : '▶'}</span>
              <span>➕ 신규 업체 및 명함 등록</span>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddCompany} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                <input placeholder="업체명*" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                <input placeholder="담당자명" value={manager} onChange={(e) => setManager(e.target.value)} style={inputStyle} />
                <input placeholder="연락처" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
                <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                <input placeholder="주소" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />

                <button type="submit" disabled={uploading} style={{ padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', marginTop: '4px', cursor: 'pointer' }}>
                  {uploading ? '저장 중...' : '업체 등록'}
                </button>
              </form>
            )}
          </div>

          {/* 업체 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCompanies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', backgroundColor: 'white', borderRadius: '12px' }}>
                등록되었거나 검색된 업체가 없습니다.
              </div>
            ) : (
              filteredCompanies.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => handleSelectCompany(c)}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <h4 style={{ margin: '0 0 6px 0', color: '#1E293B', fontSize: '16px' }}>🏢 {c.name}</h4>
                  <p style={{ margin: '2px 0', fontSize: '13px', color: '#64748B' }}>📞 {c.phone || '미등록'} | 👤 {c.manager || '미등록'}</p>
                  <p style={{ margin: '2px 0', fontSize: '13px', color: '#64748B' }}>📍 {c.address || '미등록'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. 업체 상세 화면 */}
      {viewMode === 'detail' && selectedCompany && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <button onClick={() => setViewMode('list')} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#1E293B' }}>← 뒤로</button>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A' }}>업체 상세</h3>
            <span style={{ fontSize: '18px', color: '#94A3B8' }}>⋮</span>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>👤 담당자명</span>
                <span style={{ fontWeight: '500', color: '#1E293B' }}>{selectedCompany.manager || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>📞 연락처</span>
                <span style={{ fontWeight: '500', color: '#1E293B' }}>{selectedCompany.phone || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>✉️ 이메일</span>
                <span style={{ fontWeight: '500', color: '#1E293B' }}>{selectedCompany.email || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>📍 주소</span>
                <span style={{ fontWeight: '500', color: '#1E293B', textAlign: 'right', maxWidth: '60%' }}>{selectedCompany.address || '-'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
              <button style={{ padding: '10px', borderRadius: '8px', border: '1px solid #2563EB', background: 'white', color: '#2563EB', fontWeight: '600' }}>수정</button>
              <button onClick={() => handleDeleteCompany(selectedCompany.id)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #EF4444', background: 'white', color: '#EF4444', fontWeight: '600', cursor: 'pointer' }}>삭제</button>
            </div>
          </div>

          {/* 누적 서비스 이력 및 개별 삭제 버튼 */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1E293B' }}>📋 최근 서비스 이력 ({historyList.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyList.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', margin: '10px 0' }}>등록된 서비스 이력이 없습니다.</p>
              ) : (
                historyList.map((h) => (
                  <div key={h.id} style={{ border: '1px solid #F1F5F9', padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '600' }}>
                        {h.work_date} ({h.start_time} ~ {h.end_time})
                      </span>
                      {/* 개별 이력 삭제 버튼 */}
                      <button 
                        onClick={() => handleDeleteHistoryItem(h.id)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 4px', color: '#EF4444' }}
                        title="이력 삭제"
                      >
                        🗑️
                      </button>
                    </div>
                    <p style={{ margin: '0', fontSize: '13px', color: '#334155' }}><b>작업:</b> {h.work_content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. 서비스 리포트 작성 화면 */}
      {viewMode === 'report' && selectedCompany && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 16px' }}>
            <button onClick={() => setViewMode('detail')} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#1E293B' }}>← 뒤로</button>
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

              <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>🏢 업체명</label>
                  <input value={selectedCompany.name} readOnly style={{ ...inputStyle, backgroundColor: '#E2E8F0', fontWeight: '600' }} />
                </div>
                <div>
                  <label style={labelStyle}>👤 담당자</label>
                  <input value={selectedCompany.manager || ''} readOnly style={{ ...inputStyle, backgroundColor: '#E2E8F0' }} />
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