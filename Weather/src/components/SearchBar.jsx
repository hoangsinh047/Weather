import React, { useState } from 'react'

export default function SearchBar({ onSearch, loading, onUseLocation }) {
  const [query, setQuery] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!query.trim()) return
    onSearch(query.trim())
  }

  return (
    <form className="search-bar" onSubmit={submit} aria-label="Tìm kiếm thành phố">
      <input
        aria-label="Tên thành phố"
        placeholder="Nhập thành phố, ví dụ: Hà Nội"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <button className="search-btn" type="submit" disabled={loading}>
        {loading ? 'Đang...' : 'Tìm'}
      </button>
      <button
        type="button"
        className="search-btn"
        onClick={onUseLocation}
        disabled={loading}
        title="Sử dụng vị trí của bạn"
        style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        Vị trí của tôi
      </button>
    </form>
  )
}
