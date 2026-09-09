import React, { useState } from 'react';
import './App.css';

function App() {
  // 오늘 날짜 구하기 (YYYY.MM.DD - 맨 뒤 마침표 제거)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const [formData, setFormData] = useState({
    workDate: getTodayDate(), // 2026.09.09 형식 (맨 뒤 마침표 없음)
    companyName: '',          // 업체명
    manager: '',              // 담당자
    region: '',               // 지역
    parts: ['', ''],          // 부품명 2개
    requestText: '',          // 요청내용 (기본 TEXT 지움)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePartChange = (index, value) => {
    const updatedParts = [...formData.parts];
    updatedParts[index] = value;
    setFormData((prev) => ({
      ...prev,
      parts: updatedParts,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('제출된 데이터:', formData);
    alert('저장되었습니다.');
  };

  return (
    <div className="container">
      <h2>작업 및 요청 관리</h2>
      <form onSubmit={handleSubmit}>
        
        {/* 작업일자 */}
        <div className="form-group">
          <label>작업일자</label>
          <input
            type="text"
            name="workDate"
            value={formData.workDate}
            onChange={handleChange}
          />
        </div>

        {/* 업체명 */}
        <div className="form-group">
          <label>업체명</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="업체명을 입력하세요"
          />
        </div>

        {/* 담당자 & 지역 (가로 폭 축소 레이아웃) */}
        <div className="form-row">
          <div className="form-group compact-input">
            <label>담당자</label>
            <input
              type="text"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              placeholder="담당자"
            />
          </div>

          <div className="form-group compact-input">
            <label>지역</label>
            <input
              type="text"
              name="region"
              value={formData.region}
              onChange={handleChange}
              placeholder="지역"
            />
          </div>
        </div>

        {/* 부품명 (2개) */}
        <div className="form-group">
          <label>부품명 (2개)</label>
          <div className="parts-group">
            <input
              type="text"
              value={formData.parts[0]}
              onChange={(e) => handlePartChange(0, e.target.value)}
              placeholder="부품명 1"
            />
            <input
              type="text"
              value={formData.parts[1]}
              onChange={(e) => handlePartChange(1, e.target.value)}
              placeholder="부품명 2"
            />
          </div>
        </div>

        {/* 요청내용 (빈 텍스트) */}
        <div className="form-group">
          <label>요청내용</label>
          <textarea
            name="requestText"
            value={formData.requestText}
            onChange={handleChange}
            placeholder="요청 내용을 입력하세요"
          />
        </div>

        <button type="submit" className="submit-btn">저장하기</button>
      </form>
    </div>
  );
}

export default App;