import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import SignatureCanvas from 'react-signature-canvas'
import html2canvas from 'html2canvas'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [companies, setCompanies] = useState([])
  const [allHistories, setAllHistories] = useState([])
  
  const [selectedReportImage, setSelectedReportImage] = useState(null)
  const reportFormRef = useRef(null)
  
  const [mainTab, setMainTab] = useState('companies')
  
  const [partsList, setPartsList] = useState([])
  const [partSearchTerm, setPartSearchTerm] = useState('')
  const [showAddPartForm, setShowAddPartForm] = useState(false)
  
  const [partName, setPartName] = useState('')
  const [partCode, setPartCode] = useState('')
  const [partCategory, setPartCategory] = useState('일반부품')
  const [dealerPrice, setDealerPrice] = useState(0)
  const [customerPrice, setCustomerPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [partNote, setPartNote] = useState('')
  
  const [companyPrices, setCompanyPrices] = useState([])

  const [editingPartId, setEditingPartId] = useState(null)
  const [editPartForm, setEditPartForm] = useState({
    name: '',
    code: '',
    category: '일반부품',
    dealer_price: 0,
    customer_price: 0,
    stock: 0,
    note: ''
  })
  const [editCompanyPrices, setEditCompanyPrices] = useState([])

  const [companySearchTerm, setCompanySearchTerm] = useState('')
  const [snPartSearchTerm, setSnPartSearchTerm] = useState('')
  const [showRecentOnly, setShowRecentOnly] = useState(false)

  const [detailSnSearchTerm, setDetailSnSearchTerm] = useState('')

  const [viewMode, setViewMode] = useState('list') 
  const [selectedCompany, setSelectedCompany] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ 
    name: '', 
    managers: [{ name: '', phone: '', role: '', email: '' }], 
    address: '',
    note: '',
    ink: '',
    solvent: ''
  })

  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [managers, setManagers] = useState([{ name: '', phone: '', role: '', email: '' }])
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [ink, setInk] = useState('')
  const [solvent, setSolvent] = useState('')

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
  const [modelName, setModelName] = useState('JET2Neo') // 기본값 JET2Neo
  const [workContent, setWorkContent] = useState('')
  const [selectedManager, setSelectedManager] = useState('')
  
  const [usedParts, setUsedParts] = useState([
    { name: '', quantity: 1 }
  ])
  const [confirmor, setConfirmor] = useState('박남준')

  const [historyList, setHistoryList] = useState([])
  const [uploading, setUploading] = useState(false)

  const sigCanvas = useRef({})

  useEffect(() => {
    fetchCompanies()
    fetchAllServiceHistories()
    fetchParts()
  }, [])

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    if (!error) setCompanies(data || [])
  }

  const fetchAllServiceHistories = async () => {
    const { data, error } = await supabase
      .from('service_history')
      .select('*, report_url')
      .order('created_at', { ascending: false })
    
    if (!error) setAllHistories(data || [])
  }

  const fetchParts = async () => {
    const { data, error } = await supabase.from('parts').select('*').order('created_at', { ascending: false })
    if (!error) setPartsList(data || [])
  }

  const getPartPriceInfo = (itemCodeOrName, companyName) => {
    if (!itemCodeOrName || !itemCodeOrName.trim()) return null;

    const query = itemCodeOrName.trim().toLowerCase();
    
    const matchedPart = partsList.find(p => 
      (p.code && p.code.trim().toLowerCase() === query) ||
      (p.name && p.name.trim().toLowerCase() === query)
    );

    if (!matchedPart) return { found: false };

    let companySpecialPrice = null;
    try {
      if (matchedPart.company_prices) {
        const cpList = typeof matchedPart.company_prices === 'string' 
          ? JSON.parse(matchedPart.company_prices) 
          : matchedPart.company_prices;

        if (Array.isArray(cpList)) {
          const matchedCp = cpList.find(cp => 
            cp.company_name && cp.company_name.trim().toLowerCase() === companyName.trim().toLowerCase()
          );
          if (matchedCp && matchedCp.price) {
            companySpecialPrice = Number(matchedCp.price);
          }
        }
      }
    } catch (e) {}

    return {
      found: true,
      partName: matchedPart.name,
      partCode: matchedPart.code,
      customerPrice: matchedPart.customer_price || 0,
      specialPrice: companySpecialPrice,
      finalPrice: companySpecialPrice !== null ? companySpecialPrice : (matchedPart.customer_price || 0),
      isSpecial: companySpecialPrice !== null
    };
  }

  const handleAddCompanyPriceField = () => {
    setCompanyPrices([...companyPrices, { company_name: '', price: 0 }])
  }

  const handleRemoveCompanyPriceField = (index) => {
    setCompanyPrices(companyPrices.filter((_, i) => i !== index))
  }

  const handleCompanyPriceChange = (index, field, value) => {
    const updated = [...companyPrices]
    updated[index][field] = value
    setCompanyPrices(updated)
  }

  const handleAddEditCompanyPriceField = () => {
    setEditCompanyPrices([...editCompanyPrices, { company_name: '', price: 0 }])
  }

  const handleRemoveEditCompanyPriceField = (index) => {
    setEditCompanyPrices(editCompanyPrices.filter((_, i) => i !== index))
  }

  const handleEditCompanyPriceChange = (index, field, value) => {
    const updated = [...editCompanyPrices]
    updated[index][field] = value
    setEditCompanyPrices(updated)
  }

  const handleAddPart = async (e) => {
    e.preventDefault()
    if (!partName.trim()) return alert('부품명을 입력해주세요!')
    if (!partCode.trim()) return alert('부품 코드/품번을 입력해주세요!')

    setUploading(true)
    const { error } = await supabase.from('parts').insert([{
      name: partName,
      code: partCode,
      category: partCategory,
      dealer_price: Number(dealerPrice),
      customer_price: Number(customerPrice),
      stock: Number(stock),
      company_prices: JSON.stringify(companyPrices),
      note: partNote
    }])

    setUploading(false)

    if (error) {
      alert('부품 저장 실패: ' + error.message)
    } else {
      alert('신규 부품이 등록되었습니다.')
      setPartName(''); setPartCode(''); setPartCategory('일반부품');
      setDealerPrice(0); setCustomerPrice(0); setStock(0); setPartNote('');
      setCompanyPrices([])
      setShowAddPartForm(false)
      fetchParts()
    }
  }

  const handleStartEditPart = (p) => {
    setEditingPartId(p.id)
    setEditPartForm({
      name: p.name || '',
      code: p.code || '',
      category: p.category || '일반부품',
      dealer_price: p.dealer_price || 0,
      customer_price: p.customer_price || 0,
      stock: p.stock || 0,
      note: p.note || ''
    })

    try {
      if (p.company_prices) {
        const temp = typeof p.company_prices === 'string' ? JSON.parse(p.company_prices) : p.company_prices
        setEditCompanyPrices(Array.isArray(temp) ? temp : [])
      } else {
        setEditCompanyPrices([])
      }
    } catch (e) {
      setEditCompanyPrices([])
    }
  }

  const handleSavePartEdit = async (partId) => {
    setUploading(true)
    const { error } = await supabase
      .from('parts')
      .update({
        name: editPartForm.name,
        code: editPartForm.code,
        category: editPartForm.category,
        dealer_price: Number(editPartForm.dealer_price),
        customer_price: Number(editPartForm.customer_price),
        stock: Number(editPartForm.stock),
        company_prices: JSON.stringify(editCompanyPrices),
        note: editPartForm.note
      })
      .eq('id', partId)

    setUploading(false)

    if (error) {
      alert('부품 수정 실패: ' + error.message)
    } else {
      alert('부품 정보가 수정되었습니다.')
      setEditingPartId(null)
      fetchParts()
    }
  }

  const handleDeletePart = async (partId) => {
    if (!window.confirm('이 부품을 삭제하시겠습니까?')) return
    const { error } = await supabase.from('parts').delete().eq('id', partId)
    if (!error) {
      alert('부품이 삭제되었습니다.')
      fetchParts()
    }
  }

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
    } catch (e) {}

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
      .select('*, report_url')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (!error) setHistoryList(data || [])
  }

  const handleSelectCompany = async (company) => {
    const parsedManagers = parseManagers(company.manager, company.phone, company.email)
    setSelectedCompany({ ...company, managersList: parsedManagers })
    setConfirmor('박남준')
    setSelectedManager(parsedManagers[0]?.name || '')
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

    const { data: targetHistory } = await supabase
      .from('service_history')
      .select('report_url')
      .eq('id', historyId)
      .single()

    if (targetHistory && targetHistory.report_url) {
      try {
        const urlParts = targetHistory.report_url.split('/')
        const fileName = urlParts[urlParts.length - 1]

        if (fileName) {
          await supabase.storage
            .from('reports')
            .remove([fileName])
        }
      } catch (err) {
        console.error('스토리지 파일 삭제 오류:', err)
      }
    }

    const { error } = await supabase
      .from('service_history')
      .delete()
      .eq('id', historyId)

    if (error) {
      alert('삭제 실패: ' + error.message)
    } else {
      alert('서비스 이력과 저장된 리포트 이미지가 함께 삭제되었습니다.')
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

  const handleAddReportPart = () => {
    setUsedParts([...usedParts, { name: '', quantity: 1 }])
  }

  const handleRemoveReportPart = (index) => {
    if (usedParts.length === 1) {
      alert('최소 1개의 부품 항목은 유지되어야 합니다.')
      return
    }
    setUsedParts(usedParts.filter((_, i) => i !== index))
  }

  const handleReportPartChange = (index, field, value) => {
    const updated = [...usedParts]
    updated[index][field] = value
    setUsedParts(updated)
  }

  const handleSaveReport = async (e) => {
    e.preventDefault()
    if (!selectedCompany) return
    if (!selectedManager) return alert('담당자를 선택해주세요.')

    setUploading(true)

    try {
      let reportImageUrl = ''

      if (reportFormRef.current) {
        const dateInputs = reportFormRef.current.querySelectorAll('input[type="date"]');
        dateInputs.forEach(el => {
          el.type = 'text';
          el.style.appearance = 'none';
          el.style.webkitAppearance = 'none';
          el.style.border = '1px solid #E2E8F0';
          el.style.backgroundColor = '#F8FAFC';
          el.style.borderRadius = '8px';
          el.style.padding = '10px 12px';
        });

        const inputs = reportFormRef.current.querySelectorAll('input, select, textarea');
        inputs.forEach(el => {
          el.style.lineHeight = 'normal';
          el.style.paddingTop = '12px';
          el.style.paddingBottom = '12px';
        });

        const canvas = await html2canvas(reportFormRef.current, { 
          scale: 2, 
          useCORS: true,
          width: 480,
          windowWidth: 480
        })

        dateInputs.forEach(el => {
          el.type = 'date';
          el.style.appearance = '';
          el.style.webkitAppearance = '';
          el.style.border = '';
          el.style.backgroundColor = '';
          el.style.borderRadius = '';
          el.style.padding = '';
        });

        inputs.forEach(el => {
          el.style.lineHeight = '';
          el.style.paddingTop = '';
          el.style.paddingBottom = '';
        });

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        
        if (blob) {
          const fileName = `report_${selectedCompany.id}_${Date.now()}.png`
          
          const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(fileName, blob, { contentType: 'image/png' })

          if (uploadError) {
            console.error('이미지 업로드 실패:', uploadError.message)
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('reports')
              .getPublicUrl(fileName)
            
            reportImageUrl = publicUrlData.publicUrl
          }
        }
      }

      const formattedParts = usedParts
        .filter(p => p.name && p.name.trim() !== '')
        .map(p => `${p.name.trim()} (${p.quantity}개)`)

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
          parts: JSON.stringify(formattedParts),
          confirmor: `${confirmor}${selectedManager ? ` (담당자: ${selectedManager})` : ''}`,
          report_url: reportImageUrl
        }])

      if (error) {
        alert('리포트 저장 실패: ' + error.message)
      } else {
        alert('서비스 리포트가 성공적으로 저장되었습니다!')
        setWorkContent('')
        setSn('')
        setModelName('JET2Neo') // 저장 후 기본값으로 재설정
        setUsedParts([{ name: '', quantity: 1 }])
        clearSignature()
        fetchAllServiceHistories()
        handleSelectCompany(selectedCompany)
        setViewMode('detail')
      }
    } catch (err) {
      alert('저장 중 알 수 없는 오류가 발생했습니다: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  let baseCompanies = [...companies].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  if (showRecentOnly) baseCompanies = baseCompanies.slice(0, 5)

  const filteredCompanies = companySearchTerm.trim() === '' 
    ? baseCompanies 
    : baseCompanies.filter(c => 
        (c.name && c.name.toLowerCase().includes(companySearchTerm.toLowerCase())) ||
        (c.manager && c.manager.toLowerCase().includes(companySearchTerm.toLowerCase()))
      )

  const filteredParts = partSearchTerm.trim() === ''
    ? partsList
    : partsList.filter(p => 
        (p.name && p.name.toLowerCase().includes(partSearchTerm.toLowerCase())) ||
        (p.code && p.code.toLowerCase().includes(partSearchTerm.toLowerCase()))
      )

  const isSnSearching = snPartSearchTerm.trim() !== ''
  const filteredAllHistories = !isSnSearching ? [] : allHistories.filter(h => {
    const term = snPartSearchTerm.toLowerCase()
    const snMatch = h.sn && h.sn.toLowerCase().includes(term)
    const partsMatch = h.parts && h.parts.toLowerCase().includes(term)
    return snMatch || partsMatch
  })

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
            
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800' }}>
              {mainTab === 'companies' ? '업체관리' : '부품/재고 관리'}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>안녕하세요, 오늘도 좋은 하루 되세요.</p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '12px' }}>
              <button
                onClick={() => setMainTab('companies')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: mainTab === 'companies' ? 'white' : 'transparent',
                  color: mainTab === 'companies' ? '#1E60E8' : 'white',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🏢 업체 목록
              </button>
              <button
                onClick={() => setMainTab('parts')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: mainTab === 'parts' ? 'white' : 'transparent',
                  color: mainTab === 'parts' ? '#1E60E8' : 'white',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🔧 부품 재고 목록
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {mainTab === 'companies' ? (
                <>
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
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>🔧</span>
                  <input 
                    type="text"
                    placeholder="부품명, 품번 검색..." 
                    value={partSearchTerm}
                    onChange={(e) => setPartSearchTerm(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '36px', backgroundColor: '#FFFFFF', border: 'none', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.08)', height: '42px' }}
                  />
                  {partSearchTerm && (
                    <span onClick={() => setPartSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}>✕</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '0 16px', marginTop: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div 
                onClick={() => {
                  setMainTab('parts')
                  setShowAddPartForm(true)
                }}
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
                  cursor: 'pointer',
                  border: mainTab === 'parts' && showAddPartForm ? '2px solid #2563EB' : '2px solid transparent'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>🔧</div>
                <div>
                  <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '700', display: 'block' }}>부품 등록하기</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>새로운 부품을 등록합니다</span>
                </div>
              </div>

              <div 
                onClick={() => {
                  setMainTab('companies')
                  setShowAddForm(!showAddForm)
                  if (showRecentOnly) setShowRecentOnly(false)
                }}
                style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  padding: '16px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
                  cursor: 'pointer', 
                  border: mainTab === 'companies' && showAddForm ? '2px solid #2563EB' : '2px solid transparent' 
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>➕</div>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', display: 'block' }}>업체 등록하기</span>
                <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>새로운 업체를 등록합니다.</span>
              </div>
            </div>

            {mainTab === 'parts' && showAddPartForm && (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔧 신규 부품 등록</span>
                  <button type="button" onClick={() => setShowAddPartForm(false)} style={{ border: 'none', background: 'none', color: '#94A3B8', fontSize: '16px', cursor: 'pointer' }}>✕</button>
                </h4>
                
                <form onSubmit={handleAddPart} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>부품 코드/품번 *</label>
                      <input placeholder="예: E55-0000000" value={partCode} onChange={(e) => setPartCode(e.target.value)} style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>부품명 *</label>
                      <input placeholder="예: Intermediate service KIT" value={partName} onChange={(e) => setPartName(e.target.value)} style={inputStyle} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>카테고리</label>
                      <select value={partCategory} onChange={(e) => setPartCategory(e.target.value)} style={inputStyle}>
                        <option value="일반부품">일반부품</option>
                        <option value="소모품">소모품</option>
                        <option value="필터류">Overhaul</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>초기 재고 수량</label>
                      <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>소비자 기본가격 (원)</label>
                      <input type="number" placeholder="0" value={customerPrice} onChange={(e) => setCustomerPrice(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>딜러 기본가격 (원)</label>
                      <input type="number" placeholder="0" value={dealerPrice} onChange={(e) => setDealerPrice(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>업체별 개별 단가 (선택)</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>특정 거래처의 공급가를 지정합니다.</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddCompanyPriceField}
                        style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        + 업체 추가
                      </button>
                    </div>

                    {companyPrices.map((cp, idx) => {
                      const searchKeyword = cp.company_name || ''
                      const matchedCompanies = searchKeyword.trim() === '' 
                        ? companies 
                        : companies.filter(c => c.name.toLowerCase().includes(searchKeyword.toLowerCase()))

                      return (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', position: 'relative' }}>
                          <div style={{ flex: 1.2, position: 'relative' }}>
                            <input 
                              type="text" 
                              placeholder="업체 검색..." 
                              value={cp.company_name} 
                              onChange={(e) => handleCompanyPriceChange(idx, 'company_name', e.target.value)}
                              style={{ ...inputStyle, paddingRight: '24px' }}
                            />
                            {cp.company_name && (
                              <span onClick={() => handleCompanyPriceChange(idx, 'company_name', '')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', fontSize: '12px' }}>✕</span>
                            )}
                            {searchKeyword.trim() !== '' && !companies.some(c => c.name === searchKeyword) && matchedCompanies.length > 0 && (
                              <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', backgroundColor: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '2px' }}>
                                {matchedCompanies.map(c => (
                                  <div 
                                    key={c.id} 
                                    onClick={() => handleCompanyPriceChange(idx, 'company_name', c.name)}
                                    style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                                  >
                                    {c.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <input 
                            type="number" 
                            placeholder="특가 (원)" 
                            value={cp.price} 
                            onChange={(e) => handleCompanyPriceChange(idx, 'price', e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCompanyPriceField(idx)} 
                            style={{ border: 'none', background: 'none', color: '#EF4444', fontSize: '14px', cursor: 'pointer', padding: '4px 8px' }}
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <label style={labelStyle}>📌 비고</label>
                    <textarea rows="2" placeholder="메모 및 특이사항 입력" value={partNote} onChange={(e) => setPartNote(e.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                    <button type="button" onClick={() => setShowAddPartForm(false)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', color: '#64748B', fontWeight: '600', cursor: 'pointer' }}>
                      취소
                    </button>
                    <button type="submit" disabled={uploading} style={{ padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                      {uploading ? '저장 중...' : '부품 등록'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {mainTab === 'companies' && showAddForm && (
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
                    <textarea placeholder="비고 사항을 입력하세요" rows="3" value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
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

            {mainTab === 'companies' && (
              <>
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
                            parsedParts = Array.isArray(temp) ? temp.filter(p => p && (typeof p === 'string' ? p.trim() !== '' : true)) : []
                          }
                        } catch (e) {}

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
                              <b>교체 파트:</b> {parsedParts.length > 0 ? parsedParts.map(p => typeof p === 'object' ? (p.name || p.part_id) : p).join(', ') : '없음'}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
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
                              justifyContent: 'space-between',
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
              </>
            )}

            {mainTab === 'parts' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 12px 4px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
                    🔧 등록된 부품 목록 ({filteredParts.length})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredParts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', backgroundColor: 'white', borderRadius: '16px' }}>
                      등록된 부품이 없습니다.
                    </div>
                  ) : (
                    filteredParts.map((p) => {
                      const isEditingThis = editingPartId === p.id

                      let parsedCompanyPrices = []
                      try {
                        if (p.company_prices) {
                          const temp = typeof p.company_prices === 'string' ? JSON.parse(p.company_prices) : p.company_prices
                          parsedCompanyPrices = Array.isArray(temp) ? temp.filter(cp => cp && cp.company_name) : []
                        }
                      } catch (e) {}

                      const hasSpecialPrice = parsedCompanyPrices.length > 0

                      return (
                        <div 
                          key={p.id}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          {!isEditingThis ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                      {p.category || '일반부품'}
                                    </span>
                                  </div>
                                  {p.code && <span style={{ fontSize: '12px', color: '#94A3B8' }}>#{p.code}</span>}
                                  <h4 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{p.name}</h4>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button 
                                    onClick={() => handleStartEditPart(p)}
                                    style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                  >
                                    수정
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePart(p.id)}
                                    style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>

                              <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                  <div>
                                    <span style={{ color: '#64748B', display: 'block' }}>재고수량</span>
                                    <span style={{ fontWeight: '700', color: '#10B981', fontSize: '13px' }}>
                                      {p.stock ?? 0} 개
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748B', display: 'block' }}>소비자 기본가</span>
                                    <span style={{ fontWeight: '700', color: '#2563EB', fontSize: '13px' }}>
                                      {p.customer_price ? Number(p.customer_price).toLocaleString() : 0} 원
                                    </span>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748B', display: 'block' }}>딜러 기본가</span>
                                    <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                                      {p.dealer_price ? Number(p.dealer_price).toLocaleString() : 0} 원
                                    </span>
                                  </div>
                                </div>

                                {hasSpecialPrice && (
                                  <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '6px', marginTop: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', display: 'block', marginBottom: '4px' }}>
                                      🏷️ 지정 업체 특별가 목록
                                    </span>
                                    {parsedCompanyPrices.map((cp, cIdx) => (
                                      <div key={cIdx} style={{ fontSize: '12px', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                        <span>• {cp.company_name}</span>
                                        <span style={{ color: '#D97706' }}>{Number(cp.price).toLocaleString()}원</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {p.note && (
                                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                                  📝 {p.note}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#2563EB' }}>✏️ 부품 정보 수정</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                  <div>
                                    <label style={labelStyle}>품번/코드</label>
                                    <input 
                                      value={editPartForm.code} 
                                      onChange={(e) => setEditPartForm({ ...editPartForm, code: e.target.value })} 
                                      style={inputStyle} 
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>부품명</label>
                                    <input 
                                      value={editPartForm.name} 
                                      onChange={(e) => setEditPartForm({ ...editPartForm, name: e.target.value })} 
                                      style={inputStyle} 
                                    />
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                  <div>
                                    <label style={labelStyle}>카테고리</label>
                                    <select 
                                      value={editPartForm.category} 
                                      onChange={(e) => setEditPartForm({ ...editPartForm, category: e.target.value })} 
                                      style={inputStyle}
                                    >
                                      <option value="일반부품">일반부품</option>
                                      <option value="소모품">소모품</option>
                                      <option value="필터류">필터류</option>
                                      <option value="기타">기타</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={labelStyle}>재고 수량</label>
                                    <input 
                                      type="number" 
                                      value={editPartForm.stock} 
                                      onChange={(e) => setEditPartForm({ ...editPartForm, stock: e.target.value })} 
                                      style={inputStyle} 
                                    />
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                  <div>
                                    <label style={labelStyle}>소비자 기본가</label>
                                    <input 
                                      type="number" 
                                      value={editPartForm.customer_price} 
                                      onChange={(e) => setEditPartForm({ ...editPartForm, customer_price: e.target.value })} 
                                      style={inputStyle} 
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>딜러 기본가</label>
                                    <input 
                                      type="number" 
                                      value={editPartForm.dealer_price} 
                                      onChange={(e) => setEditPartForm({ ...editPartForm, dealer_price: e.target.value })} 
                                      style={inputStyle} 
                                    />
                                  </div>
                                </div>

                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>업체별 특가 관리</span>
                                    <button 
                                      type="button" 
                                      onClick={handleAddEditCompanyPriceField}
                                      style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                      + 업체 추가
                                    </button>
                                  </div>

                                  {editCompanyPrices.map((cp, idx) => {
                                    const searchKeyword = cp.company_name || ''
                                    const matchedCompanies = searchKeyword.trim() === '' 
                                      ? companies 
                                      : companies.filter(c => c.name.toLowerCase().includes(searchKeyword.toLowerCase()))

                                    return (
                                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0', position: 'relative' }}>
                                        <div style={{ flex: 1.2, position: 'relative' }}>
                                          <input 
                                            type="text" 
                                            placeholder="업체 검색..." 
                                            value={cp.company_name} 
                                            onChange={(e) => handleEditCompanyPriceChange(idx, 'company_name', e.target.value)}
                                            style={{ ...inputStyle, padding: '6px', paddingRight: '24px' }}
                                          />
                                          {cp.company_name && (
                                            <span onClick={() => handleEditCompanyPriceChange(idx, 'company_name', '')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', fontSize: '11px' }}>✕</span>
                                          )}
                                          {searchKeyword.trim() !== '' && !companies.some(c => c.name === searchKeyword) && matchedCompanies.length > 0 && (
                                            <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', backgroundColor: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', maxHeight: '140px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '2px' }}>
                                              {matchedCompanies.map(c => (
                                                <div 
                                                  key={c.id} 
                                                  onClick={() => handleEditCompanyPriceChange(idx, 'company_name', c.name)}
                                                  style={{ padding: '6px 10px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                                                >
                                                  {c.name}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        <input 
                                          type="number" 
                                          placeholder="특가 (원)" 
                                          value={cp.price} 
                                          onChange={(e) => handleEditCompanyPriceChange(idx, 'price', e.target.value)}
                                          style={{ ...inputStyle, flex: 1, padding: '6px' }}
                                        />
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveEditCompanyPriceField(idx)} 
                                          style={{ border: 'none', background: 'none', color: '#EF4444', fontSize: '13px', cursor: 'pointer', padding: '4px' }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>

                                <div>
                                  <label style={labelStyle}>비고</label>
                                  <textarea 
                                    rows="2" 
                                    value={editPartForm.note} 
                                    onChange={(e) => setEditPartForm({ ...editPartForm, note: e.target.value })} 
                                    style={inputStyle} 
                                  />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => setEditingPartId(null)} 
                                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'white', color: '#64748B', fontWeight: '600', cursor: 'pointer' }}
                                  >
                                    취소
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleSavePartEdit(p.id)} 
                                    disabled={uploading} 
                                    style={{ padding: '8px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                                  >
                                    {uploading ? '저장 중...' : '저장하기'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <span style={{ color: '#64748B' }}>📍 주소</span>
                    <span style={{ fontWeight: '500', color: '#1E293B', textAlign: 'left', wordBreak: 'keep-all' }}>
                      {selectedCompany.address || '-'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '600' }}>📌 비고</span>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F1F5F9', color: '#334155', whiteSpace: 'pre-wrap', minHeight: '38px', fontSize: '13px' }}>
                      {selectedCompany.card_url || <span style={{ color: '#94A3B8' }}>등록된 비고 사항이 없습니다.</span>}
                    </div>
                  </div>

                  {(() => {
                    const inkInfo = getPartPriceInfo(selectedCompany.ink, selectedCompany.name);
                    const solventInfo = getPartPriceInfo(selectedCompany.solvent, selectedCompany.name);

                    return (
                      <div style={{ backgroundColor: '#EFF6FF', padding: '14px', borderRadius: '12px', marginTop: '6px', border: '1px solid #DBEAFE' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <span style={{ color: '#1E40AF', fontWeight: '600', fontSize: '13px', display: 'block' }}>🧪 잉크 품번</span>
                            <span style={{ fontWeight: '700', color: '#1E3A8A', fontSize: '14px' }}>{selectedCompany.ink || '미등록'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {inkInfo && inkInfo.found ? (
                              <div>
                                {inkInfo.isSpecial ? (
                                  <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCD34D', display: 'inline-block', marginBottom: '2px' }}>
                                     업체 특별가
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '2px' }}>기본가</span>
                                )}
                                <div style={{ fontWeight: '800', color: inkInfo.isSpecial ? '#D97706' : '#2563EB', fontSize: '15px' }}>
                                  {inkInfo.finalPrice.toLocaleString()} 원
                                </div>
                              </div>
                            ) : (
                              selectedCompany.ink && <span style={{ fontSize: '11px', color: '#94A3B8' }}>부품 미등록</span>
                            )}
                          </div>
                        </div>

                        <div style={{ height: '1px', backgroundColor: '#BFDBFE', margin: '8px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ color: '#1E40AF', fontWeight: '600', fontSize: '13px', display: 'block' }}>💧 희석제 품번</span>
                            <span style={{ fontWeight: '700', color: '#1E3A8A', fontSize: '14px' }}>{selectedCompany.solvent || '미등록'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {solventInfo && solventInfo.found ? (
                              <div>
                                {solventInfo.isSpecial ? (
                                  <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCD34D', display: 'inline-block', marginBottom: '2px' }}>
                                     업체 특별가
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginBottom: '2px' }}>기본가</span>
                                )}
                                <div style={{ fontWeight: '800', color: solventInfo.isSpecial ? '#D97706' : '#2563EB', fontSize: '15px' }}>
                                  {solventInfo.finalPrice.toLocaleString()} 원
                                </div>
                              </div>
                            ) : (
                              selectedCompany.solvent && <span style={{ fontSize: '11px', color: '#94A3B8' }}>부품 미등록</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

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

                <div>
                  <label style={labelStyle}>📌 비고</label>
                  <textarea rows="3" placeholder="비고 사항을 입력하세요" value={editData.note} onChange={(e) => setEditData({ ...editData, note: e.target.value })} style={inputStyle} />
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
                      parsedParts = Array.isArray(temp) ? temp.filter(p => p && (typeof p === 'string' ? p.trim() !== '' : true)) : []
                    }
                  } catch (e) {}

                  return (
                    <div 
                      key={h.id} 
                      onClick={() => {
                        if (h.report_url) setSelectedReportImage(h.report_url)
                      }}
                      style={{ border: '1px solid #F1F5F9', padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', cursor: h.report_url ? 'pointer' : 'default' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: '600' }}>
                          {h.work_date} ({h.start_time} ~ {h.end_time}) {h.report_url && ' [리포트 보기]'}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteHistoryItem(h.id)
                          }}
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
                        <b>교체 파트:</b> {parsedParts.length > 0 ? parsedParts.map(p => typeof p === 'object' ? (p.name || p.part_id) : p).join(', ') : '없음'}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. 서비스 리포트 작성 화면 (모델명 드롭다운 목차 반영) */}
      {viewMode === 'report' && selectedCompany && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 16px' }}>
            <button onClick={() => setViewMode('detail')} style={{ border: 'none', background: 'none', fontSize: '17px', cursor: 'pointer', color: '#1E293B', fontWeight: '600' }}>← 뒤로</button>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#0F172A' }}>서비스 리포트 작성</h3>
            <div style={{ width: '24px' }}></div>
          </div>

          <div ref={reportFormRef} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <form onSubmit={handleSaveReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* 상단 업체명 & 작업일자 한 줄 배치 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: '#EFF6FF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #DBEAFE', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: '700', display: 'block', marginBottom: '2px' }}>업체명</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E3A8A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCompany.name}</span>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '2px' }}>작업 일자</span>
                  <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '700', color: '#1E293B', padding: 0, outline: 'none', width: '100%' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>시작 시간</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <select value={startHour} onChange={(e) => setStartHour(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                        <option key={h} value={h}>{h}시</option>
                      ))}
                    </select>
                    <select value={startMin} onChange={(e) => setStartMin(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      {['00', '10', '20', '30', '40', '50'].map(m => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>종료 시간</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <select value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                        <option key={h} value={h}>{h}시</option>
                      ))}
                    </select>
                    <select value={endMin} onChange={(e) => setEndMin(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      {['00', '10', '20', '30', '40', '50'].map(m => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 모델명 목차 드롭다운 선택 수정 부분 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>모델명</label>
                  <select value={modelName} onChange={(e) => setModelName(e.target.value)} style={inputStyle}>
                    <option value="JET1Neo">JET1Neo</option>
                    <option value="JET2Neo">JET2Neo</option>
                    <option value="JET3">JET3</option>
                    <option value="JET3up">JET3up</option>
                    <option value="JET3pi">JET3pi</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>시리얼 번호 (S/N)</label>
                  <input placeholder="S/N 입력" value={sn} onChange={(e) => setSn(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>작업 담당자 선택</label>
                <select value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} style={inputStyle}>
                  {selectedCompany.managersList && selectedCompany.managersList.map((m, idx) => (
                    <option key={idx} value={m.name}>{m.name} {m.role ? `(${m.role})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>작업 내용</label>
                <textarea rows="4" placeholder="수리 및 점검 내용을 입력하세요" value={workContent} onChange={(e) => setWorkContent(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, margin: 0 }}>교체 파트 및 부품</label>
                  <button type="button" onClick={handleAddReportPart} style={{ border: 'none', background: '#EFF6FF', color: '#2563EB', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ 부품 추가</button>
                </div>
                {usedParts.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                    <input 
                      placeholder="부품명 또는 품번 입력" 
                      value={p.name} 
                      onChange={(e) => handleReportPartChange(idx, 'name', e.target.value)} 
                      style={{ ...inputStyle, flex: 2 }} 
                    />
                    <input 
                      type="number" 
                      min="1" 
                      value={p.quantity} 
                      onChange={(e) => handleReportPartChange(idx, 'quantity', e.target.value)} 
                      style={{ ...inputStyle, flex: 1 }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveReportPart(idx)} 
                      style={{ border: 'none', background: 'none', color: '#EF4444', fontSize: '14px', cursor: 'pointer', padding: '4px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ ...labelStyle, margin: 0 }}>고객 서명</label>
                  <button type="button" onClick={clearSignature} style={{ border: 'none', background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>서명 초기화</button>
                </div>
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                  <SignatureCanvas ref={sigCanvas} canvasProps={{ width: 440, height: 180, className: 'sigCanvas' }} />
                </div>
              </div>

              <button type="submit" disabled={uploading} style={{ padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
                {uploading ? '저장 중...' : '서비스 리포트 저장'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🖼️ 전체 화면 이미지 팝업 모달 */}
      {selectedReportImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <button 
            onClick={() => setSelectedReportImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            ✕
          </button>

          <div style={{
            width: '100%',
            maxWidth: '460px',
            maxHeight: '85vh',
            overflowY: 'auto',
            borderRadius: '16px',
            backgroundColor: 'white',
            padding: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            boxSizing: 'border-box'
          }}>
            <img 
              src={selectedReportImage} 
              alt="서비스 리포트 이미지" 
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} 
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default App