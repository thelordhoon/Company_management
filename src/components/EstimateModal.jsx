import React, { useState } from 'react';

export default function EstimateModal({ selectedCompany, products = [], setViewMode, handleSaveEstimate }) {
  const [estimateDate, setEstimateDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([
    { code: '', description: '', price: 0, qty: 1, amount: 0, searchTerm: '', showDropdown: false }
  ]);
  const [note, setNote] = useState('');

  // 검색어 입력 시 처리
  const handleSearchChange = (index, value) => {
    const newItems = [...items];
    newItems[index].searchTerm = value;
    newItems[index].showDropdown = true;
    setItems(newItems);
  };

  // 검색 결과 중 품목 선택 시 처리
  const handleSelectProduct = (index, product) => {
    const price = product.price || product.end_user_price || 0;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      code: product.code || product.part_number || '',
      description: product.name || product.description || '',
      price: price,
      amount: price * newItems[index].qty,
      searchTerm: product.name || product.description || '',
      showDropdown: false
    };
    setItems(newItems);
  };

  // 수량 및 단가 직접 변경
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'price' || field === 'qty') {
      const price = Number(newItems[index].price) || 0;
      const qty = Number(newItems[index].qty) || 0;
      newItems[index].amount = price * qty;
    }
    setItems(newItems);
  };

  // 행 추가 & 삭제
  const addItemRow = () => {
    setItems([...items, { code: '', description: '', price: 0, qty: 1, amount: 0, searchTerm: '', showDropdown: false }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // 계산
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const vatAmount = Math.floor(totalAmount * 0.1);
  const grandTotal = totalAmount + vatAmount;

  // 저장 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    const estimatePayload = {
      company_id: selectedCompany?.id,
      estimate_date: estimateDate,
      total_amount: totalAmount,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      items: items.map(({ searchTerm, showDropdown, ...rest }) => rest), // 순수 데이터만 추출
      note: note
    };
    handleSaveEstimate(estimatePayload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ padding: '20px', maxWidth: '850px', margin: '0 auto', background: '#fff' }}>
        <h2>견적서 작성</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <p><strong>수신:</strong> {selectedCompany?.name || '업체 미선택'}</p>
            <label><strong>견적일자: </strong></label>
            <input 
              type="date" 
              value={estimateDate} 
              onChange={(e) => setEstimateDate(e.target.value)} 
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }} border="1">
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ width: '35%' }}>품목 검색 (품명/코드)</th>
                <th style={{ width: '30%' }}>품목 및 규격</th>
                <th>단가</th>
                <th style={{ width: '60px' }}>수량</th>
                <th>금액</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                // 실시간 필터링 (최대 10개만 표시하여 속도 최적화)
                const filteredProducts = item.searchTerm 
                  ? products.filter(p => {
                      const search = item.searchTerm.toLowerCase();
                      const nameMatch = (p.name || p.description || '').toLowerCase().includes(search);
                      const codeMatch = (p.code || p.part_number || '').toLowerCase().includes(search);
                      return nameMatch || codeMatch;
                    }).slice(0, 10)
                  : [];

                return (
                  <tr key={idx}>
                    <td style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="품명 또는 코드로 검색..."
                        value={item.searchTerm}
                        onChange={(e) => handleSearchChange(idx, e.target.value)}
                        onFocus={() => handleSearchChange(idx, item.searchTerm)}
                        style={{ width: '95%', padding: '6px' }}
                      />
                      
                      {/* 검색 자동완성 팝업 */}
                      {item.showDropdown && filteredProducts.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: '#fff', border: '1px solid #ccc', zIndex: 999,
                          maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {filteredProducts.map((p, pIdx) => (
                            <div 
                              key={pIdx}
                              onClick={() => handleSelectProduct(idx, p)}
                              style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: '13px' }}
                              onMouseDown={(e) => e.preventDefault()} // input focus 유지
                            >
                              <strong>{p.name || p.description}</strong>
                              <span style={{ color: '#666', display: 'block', fontSize: '11px' }}>
                                코드: {p.code || p.part_number || 'N/A'} | {Number(p.price || p.end_user_price || 0).toLocaleString()}원
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={item.description} 
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)} 
                        style={{ width: '95%', padding: '6px' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={item.price} 
                        onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))} 
                        style={{ width: '80px', padding: '6px' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))} 
                        style={{ width: '45px', padding: '6px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                      {item.amount.toLocaleString()}원
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" onClick={() => removeItemRow(idx)}>X</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button type="button" onClick={addItemRow} style={{ marginBottom: '15px', padding: '6px 12px' }}>
            + 항목 추가
          </button>

          <div style={{ background: '#f8f9fa', padding: '12px', marginBottom: '15px', textAlign: 'right' }}>
            <p style={{ margin: '4px 0' }}>공급가액: {totalAmount.toLocaleString()} 원</p>
            <p style={{ margin: '4px 0' }}>부가세 (VAT 10%): {vatAmount.toLocaleString()} 원</p>
            <h3 style={{ margin: '8px 0 0 0', color: '#0284c7' }}>총 합계: {grandTotal.toLocaleString()} 원</h3>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>비고:</strong></label><br />
            <textarea 
              rows="3" 
              style={{ width: '98%', marginTop: '5px' }} 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="특이사항 및 작업 내용 입력"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px' }}>
              견적서 저장
            </button>
            <button type="button" onClick={() => setViewMode('detail')} style={{ padding: '8px 16px' }}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}