export default function Ticker() {
  const items = [
    'Bộ sưu tập 2026 đã khai mở',
    'Nghìn hai trăm chuyến xe mỗi tháng',
    'Trợ lý ảo hầu chuyện bốn mùa',
    'Giao xe tận nơi trên khắp cõi Việt',
    'Bảo hiểm trọn vẹn mọi hành trình',
  ]

  const renderItems = () => (
    <>
      {items.map((item, i) => (
        <span key={i}>
          <span className={i % 2 === 0 ? 'dot' : 'star-mini'}>
            {i % 2 === 0 ? '' : '✦'}
          </span>
          {item}
        </span>
      ))}
    </>
  )

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {renderItems()}
        {renderItems()}
      </div>
    </div>
  )
}