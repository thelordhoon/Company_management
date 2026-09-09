import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import SignatureCanvas from 'react-signature-canvas'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [companies, setCompanies] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  
  // 신규 업체 입력
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [manager, setManager] = useState('')
  const [address, setAddress] = useState('')
  const [cardFile, setCardFile] = useState(null)

  // 서비스 리포트 폼 상태
  const [workDate, setWorkDate] = useState(new Date().toISOString().substring(0, 10))
  const [startHour, setStartHour] = useState('00')
  const [startMin, setStartMin] = useState('00')
  const [endHour, setEndHour] = useState('00')
  const [endMin, setEndMin] = useState('00')
  const [region, setRegion] = useState('')
  const [sn, setSn] = useState('')
  const [modelName, setModelName] = useState('JET2Neo')
  const [workContent, setWorkContent] = useState('')
  const [parts, setParts] = useState(['', '', '']) // 3칸 구조
  const [confirmor, setConfirmor] = useState('')
  
  const [historyList, setHistoryList] = useState([])
  const [uploading, setUploading] = useState(false)

  const sigCanvas = useRef({})

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*')
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
    let cardUrl = ''
    if (cardFile) cardUrl = await uploadFile(cardFile)

    const { error } = await supabase
      .from('companies')
      .insert([{ name, phone, manager, address, card_url: cardUrl }])

    setUploading(false)

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      alert('업체가 등록되었습니다.')
      setName(''); setPhone(''); setManager(''); setAddress(''); setCardFile(null)
      fetchCompanies()
    }
  }

  const handleSelectCompany = async (company) => {
    setSelectedCompany(company)
    setConfirmor(company.manager || '')
    
    const { data, error } = await supabase
      .from('service_history')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
    
    if (!error) setHistoryList(data || [])
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
        region,
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
      setParts(['', '', ''])
      clearSignature()
      handleSelectCompany(selectedCompany)
    }
  }

  // 검색어가 없으면 빈 배열, 입력하면 해당 검색어 포함된 업체 필터링
  const filteredCompanies = searchTerm.trim() === '' 
    ? [] 
    : companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // 모바일 입력 줌인 방지용 공통 인라인 스타일
  const inputStyle = {
    width: '100%',
    padding: '8px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  }

  return (
    <div style={{ padding: '10px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', background: '#f4f6f9', minHeight: '100vh' }}>
      <h3 style={{ textAlign: 'center', color: '#333', margin: '10px 0' }}>📱 (주)메이쓰 현장 관리</h3>

      {/* 🔍 업체 검색 */}
      <input 
        type="text"
        placeholder="🔍 업체명 검색..." 
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          if (e.target.value.trim() === '') setSelectedCompany(null)
        }}
        style={{ ...inputStyle, marginBottom: '10px' }}
      />

      {/* ➕ 신규 업체 등록 */}
      <details style={{ marginBottom: '15px', background: 'white', padding: '10px', borderRadius: '6px' }}>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: '#007bff', fontSize: '14px' }}>➕ 신규 업체 및 명함 등록</summary>
        <form onSubmit={handleAddCompany} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <input placeholder="업체명*" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input placeholder="전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          <input placeholder="담당자" value={manager} onChange={(e) => setManager(e.target.value)} style={inputStyle} />
          <input placeholder="주소" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
          <input type="file" accept="image/*" onChange={(e) => setCardFile(e.target.files[0])} style={{ fontSize: '14px' }} />

          <button type="submit" disabled={uploading} style={{ padding: '8px', background: uploading ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
            {uploading ? '저장 중...' : '업체 등록'}
          </button>
        </form>
      </details>

      {/* 🏢 검색 시에만 출력되는 업체 목록 */}
      {searchTerm.trim() !== '' && (
        <div style={{ marginBottom: '15px' }}>
          {filteredCompanies.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', background: 'white', padding: '10px', borderRadius: '6px' }}>
              검색된 업체가 없습니다.
            </p>
          ) : (
            filteredCompanies.map((c) => (
              <div 
                key={c.id} 
                onClick={() => handleSelectCompany(c)}
                style={{ 
                  padding: '10px', 
                  border: selectedCompany?.id === c.id ? '2px solid #007bff' : '1px solid #ddd', 
                  borderRadius: '6px', 
                  background: 'white',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                <h4 style={{ margin: '0 0 4px 0', color: '#007bff' }}>{c.name}</h4>
                <p style={{ margin: '2px 0', fontSize: '13px' }}>📞 {c.phone || '미등록'} | 👤 {c.manager || '미등록'}</p>
                <p style={{ margin: '2px 0', fontSize: '13px' }}>📍 {c.address || '미등록'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 📑 모바일 맞춤 Service Report 폼 */}
      {selectedCompany && (
        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
          <h4 style={{ textAlign: 'center', margin: '0 0 12px 0' }}>(주)메이쓰 Service Report</h4>

          <form onSubmit={handleSaveReport} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 1. 작업일자 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>작업일자</label>
              <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} style={inputStyle} />
            </div>

            {/* 2. 시작시간, 종료시간 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>시작시간</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <input value={startHour} onChange={(e) => setStartHour(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /> : 
                  <input value={startMin} onChange={(e) => setStartMin(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>종료시간</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <input value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /> : 
                  <input value={endMin} onChange={(e) => setEndMin(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                </div>
              </div>
            </div>

            {/* 3. 업체명, 담당자, 지역 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>업체명</label>
                <input value={selectedCompany.name} readOnly style={{ ...inputStyle, background: '#f0f0f0', padding: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>담당자</label>
                <input value={selectedCompany.manager || ''} readOnly style={{ ...inputStyle, background: '#f0f0f0', padding: '6px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>지역</label>
                <input value={region} onChange={(e) => setRegion(e.target.value)} style={{ ...inputStyle, padding: '6px' }} />
              </div>
            </div>

            {/* 4. 모델명, S/N */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>모델명</label>
                <select value={modelName} onChange={(e) => setModelName(e.target.value)} style={inputStyle}>
                  <option value="JET2Neo">JET2Neo</option>
                  <option value="JET3Up">JET3Up</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>S/N</label>
                <input value={sn} onChange={(e) => setSn(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* 5. 작업내용 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>작업내용</label>
              <textarea rows="3" value={workContent} onChange={(e) => setWorkContent(e.target.value)} style={inputStyle} />
            </div>

            {/* 6. 부품명 (3칸) */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>부품명 (3개)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
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
                    style={{ ...inputStyle, padding: '6px' }}
                  />
                ))}
              </div>
            </div>

            {/* 7. 확인자 및 서명 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end', marginTop: '6px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>확인자</label>
                <input value={confirmor} onChange={(e) => setConfirmor(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>서명</label>
                  <button type="button" onClick={clearSignature} style={{ padding: '2px 4px', fontSize: '10px' }}>지우기</button>
                </div>
                <div style={{ border: '1px solid #ccc', borderRadius: '4px', background: '#fafafa', touchAction: 'none' }}>
                  <SignatureCanvas 
                    ref={sigCanvas} 
                    penColor="black"
                    canvasProps={{ width: 180, height: 80, className: 'sigCanvas' }} 
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={uploading} style={{ width: '100%', padding: '12px', background: uploading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
              {uploading ? '저장 중...' : '서비스 리포트 저장'}
            </button>
          </form>

          {/* 누적 이력 */}
          <h4 style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px', color: '#555' }}>📋 누적 이력 ({historyList.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historyList.map((h) => (
              <div key={h.id} style={{ border: '1px solid #eee', padding: '8px', borderRadius: '4px', background: '#fafafa', fontSize: '13px' }}>
                <p style={{ margin: '0', color: '#666' }}><b>일자:</b> {h.work_date} ({h.start_time}~{h.end_time})</p>
                <p style={{ margin: '2px 0' }}><b>작업내용:</b> {h.work_content}</p>
                {h.signature_url && (
                  <img src={h.signature_url} alt="서명" style={{ height: '30px', marginTop: '4px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App