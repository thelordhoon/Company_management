import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

// 분리된 3개 컴포넌트 임포트
import CompanyList from './components/CompanyList'
import CompanyDetail from './components/CompanyDetail'
import ServiceReportModal from './components/ServiceReportModal'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [companies, setCompanies] = useState([])
  const [allHistories, setAllHistories] = useState([]) // 전체 서비스 이력 저장
  
  // 메인 검색 및 필터 상태
  const [companySearchTerm, setCompanySearchTerm] = useState('') // 업체명/담당자명 검색
  const [snPartSearchTerm, setSnPartSearchTerm] = useState('') // S/N / 부품명 검색
  const [showRecentOnly, setShowRecentOnly] = useState(false) // 최근 등록 5개 업체 필터 상태

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
    note: '',
    ink: '',
    solvent: ''
  })

  // 신규 업체 입력 상태
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [managers, setManagers] = useState([{ name: '', phone: '', role: '', email: '' }])
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
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
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
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

  // 담당자 목록 파싱 도우미
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
        card_url: note,
        ink,
        solvent
      }])

    setUploading(false)

    if (error) {
      alert('저장 실패: ' + error.message)
    } else {
      alert('업체가 등록되었습니다.')
      setName(''); setAddress(''); setNote(''); setInk(''); setSolvent('');
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
      note: company.card_url || '',
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
        card_url: editData.note,
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
      const updated = data && data.length > 0 ? data[0] : { ...selectedCompany, ...editData, card_url: editData.note }
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
  let baseCompanies = [...companies].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  if (showRecentOnly) {
    baseCompanies = baseCompanies.slice(0, 5)
  }

  const filteredCompanies = companySearchTerm.trim() === '' 
    ? baseCompanies 
    : baseCompanies.filter(c => 
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

  return (
    <div style={{ backgroundColor: '#F4F7FB', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '480px', margin: '0 auto', position: 'relative', paddingBottom: '24px', boxSizing: 'border-box' }}>
      
      {/* 1. 메인 목록 화면 */}
      {viewMode === 'list' && (
        <CompanyList
          companySearchTerm={companySearchTerm}
          setCompanySearchTerm={setCompanySearchTerm}
          snPartSearchTerm={snPartSearchTerm}
          setSnPartSearchTerm={setSnPartSearchTerm}
          showRecentOnly={showRecentOnly}
          setShowRecentOnly={setShowRecentOnly}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          handleAddCompany={handleAddCompany}
          uploading={uploading}
          name={name}
          setName={setName}
          managers={managers}
          handleManagerChange={handleManagerChange}
          handleAddManagerField={handleAddManagerField}
          handleRemoveManagerField={handleRemoveManagerField}
          address={address}
          setAddress={setAddress}
          note={note}
          setNote={setNote}
          ink={ink}
          setInk={setInk}
          solvent={solvent}
          setSolvent={setSolvent}
          isSnSearching={isSnSearching}
          filteredAllHistories={filteredAllHistories}
          filteredCompanies={filteredCompanies}
          companies={companies}
          handleSelectCompany={handleSelectCompany}
          parseManagers={parseManagers}
        />
      )}

      {/* 2. 업체 상세 화면 */}
      {viewMode === 'detail' && selectedCompany && (
        <CompanyDetail
          setViewMode={setViewMode}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          selectedCompany={selectedCompany}
          handleStartEdit={handleStartEdit}
          handleDeleteCompany={handleDeleteCompany}
          editData={editData}
          setEditData={setEditData}
          handleEditAddManagerField={handleEditAddManagerField}
          handleEditRemoveManagerField={handleEditRemoveManagerField}
          handleEditManagerChange={handleEditManagerChange}
          handleSaveCompanyEdit={handleSaveCompanyEdit}
          uploading={uploading}
          detailSnSearchTerm={detailSnSearchTerm}
          setDetailSnSearchTerm={setDetailSnSearchTerm}
          filteredDetailHistory={filteredDetailHistory}
          handleDeleteHistoryItem={handleDeleteHistoryItem}
        />
      )}

      {/* 3. 서비스 리포트 작성 화면 */}
      {viewMode === 'report' && selectedCompany && (
        <ServiceReportModal
          setViewMode={setViewMode}
          handleSaveReport={handleSaveReport}
          uploading={uploading}
          workDate={workDate}
          setWorkDate={setWorkDate}
          startHour={startHour}
          setStartHour={setStartHour}
          startMin={startMin}
          setStartMin={setStartMin}
          endHour={endHour}
          setEndHour={setEndHour}
          endMin={endMin}
          setEndMin={setEndMin}
          selectedCompany={selectedCompany}
          confirmor={confirmor}
          setConfirmor={setConfirmor}
          modelName={modelName}
          setModelName={setModelName}
          sn={sn}
          setSn={setSn}
          workContent={workContent}
          setWorkContent={setWorkContent}
          parts={parts}
          setParts={setParts}
          clearSignature={clearSignature}
          sigCanvas={sigCanvas}
        />
      )}

    </div>
  )
}

export default App