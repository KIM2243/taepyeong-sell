const fs = require('fs');
const file = 'c:\\dev\\taepyeong-sell\\src\\app\\globals.css';
let content = fs.readFileSync(file, 'utf8');

// 기존 .admin-form-select 클래스 모두 제거
content = content.replace(/\.admin-form-select\s*\{[^}]+\}/g, '');
content = content.replace(/\.admin-form-select:focus\s*\{[^}]+\}/g, '');

const newCss = `
.admin-form-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  padding: 12px 40px 12px 16px !important;
  border: 1px solid var(--slate-200) !important;
  border-radius: var(--radius-md) !important;
  font-family: inherit;
  font-size: 0.95rem !important;
  color: var(--slate-900) !important;
  background-color: var(--slate-50) !important;
  transition: border-color 0.2s, box-shadow 0.2s;
  height: 46.5px !important;
  line-height: 1.5;
}
.admin-form-select:focus {
  outline: none;
  border-color: var(--primary) !important;
  background: #fff !important;
  box-shadow: 0 0 0 3px rgba(0,91,130,0.1) !important;
}
`;

fs.writeFileSync(file, content + newCss, 'utf8');
console.log('CSS fixed');
