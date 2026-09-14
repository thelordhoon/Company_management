import React, { useState } from 'react'
import { supabase } from '../App' // App.jsx의 supabase 인스턴스 가져오기

export default function PartModal({ isOpen, onClose }) {
  const [partName, setPartName] = useState('')
  const [partCode, setPartCode] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('일반부품')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  // 부품 저장 함수
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!partName.trim()) {
      alert('부품명을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.from('parts').insert([
        {
          name: partName,
          code: partCode,
          price: price ? Number(price) : 0,
          category: category,
          note: note,
          created_at: new Date()
        }
      ])

      if (error) throw error

      alert('부품이 성공적으로 등록되었습니다!')
      // 폼 초기화 후 모달 닫기
      setPartName('')
      setPartCode('')
      setPrice('')
      setCategory('일반부품')
      setNote('')
      onClose()
    } catch (err) {
      console.error(err)
      alert('부품 등록 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          boxSizing: 'border-box',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫힘 방지
      >
        {/* 모달 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔧</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>신규 부품 등록</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: '18px', color: '#94A3B8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>⚙️ 부품명*</label>
            <input 
              type="text" 
              placeholder="예: 메인 필터, 노즐 조립체" 
              value={partName} 
              onChange={(e) => setPartName(e.target.value)} 
              style={inputStyle} 
              required
            />
          </div>

          <div>
            <label style={labelStyle}>🏷️ 부품 코드/품번</label>
            <input 
              type="text" 
              placeholder="예: PT-2026-001" 
              value={partCode} 
              onChange={(e) => setPartCode(e.target.value)} 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>📁 카테고리</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                style={inputStyle}
              >
                <option value="일반부품">일반부품</option>
                <option value="소모품">소모품</option>
                <option value="필터류">필터류</option>
                <option value="전자부품">전자부품</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>💰 단가 (원)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                style={inputStyle} 
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>📌 비고 / 설명을 입력하세요</label>
            <textarea 
              rows="3" 
              placeholder="호환 규격이나 특징을 적어주세요." 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              style={inputStyle} 
            />
          </div>

          {/* 하단 버튼 */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ flex: 2, padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
            >
              {loading ? '등록 중...' : '부품 등록 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}