import React, { useState, useEffect } from "react";

// تعریف اینترفیس برای آیتم‌های بازار (طلا، ارز و رمزارز)
interface MarketDataItem {
  date: string;
  time: string;
  symbol: string;
  name: string;
  price: number;
  change_percent: number;
  unit: string;
}

// اینترفیس پاسخ API
interface ApiResponse {
  gold: MarketDataItem[];
  currency: MarketDataItem[];
  cryptocurrency: MarketDataItem[];
}

const MarketBoard: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // تابع دریافت اطلاعات از API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://brsapi.ir/FreeTsetmcBourseApi/Api_Free_Gold_Currency_v2.json");
      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات از سرور");
      }
      const json: ApiResponse = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // دریافت اطلاعات در mount کامپوننت و به‌روزرسانی هر 5 دقیقه (300000 میلی‌ثانیه)
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div style={styles.loading}>در حال بارگذاری...</div>;
  }

  if (error) {
    return <div style={styles.error}>خطا: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>به‌روزرسانی لحظه‌ای بازار</h2>

      {data && (
        <>
          {/* نمایش بخش سکه (طلا) */}
          <div style={styles.categoryContainer}>
            <h3 style={styles.categoryTitle}>سکه و طلا</h3>
            <div style={styles.cardsContainer}>
              {data.gold.map((item) => (
                <div key={item.symbol} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={styles.itemSymbol}>{item.symbol}</span>
                  </div>
                  <div style={styles.cardBody}>
                    <span style={styles.itemPrice}>
                      {item.price} {item.unit}
                    </span>
                    <span
                      style={{
                        ...styles.itemChange,
                        color: item.change_percent >= 0 ? "#4caf50" : "#f44336"
                      }}
                    >
                      {item.change_percent}%
                    </span>
                  </div>
                  <div style={styles.itemTime}>
                    {item.time} - {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* نمایش بخش ارز */}
          <div style={styles.categoryContainer}>
            <h3 style={styles.categoryTitle}>ارز</h3>
            <div style={styles.cardsContainer}>
              {data.currency.map((item) => (
                <div key={item.symbol} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={styles.itemSymbol}>{item.symbol}</span>
                  </div>
                  <div style={styles.cardBody}>
                    <span style={styles.itemPrice}>
                      {item.price} {item.unit}
                    </span>
                    <span
                      style={{
                        ...styles.itemChange,
                        color: item.change_percent >= 0 ? "#4caf50" : "#f44336"
                      }}
                    >
                      {item.change_percent}%
                    </span>
                  </div>
                  <div style={styles.itemTime}>
                    {item.time} - {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* نمایش بخش رمزارز */}
          <div style={styles.categoryContainer}>
            <h3 style={styles.categoryTitle}>رمزارز</h3>
            <div style={styles.cardsContainer}>
              {data.cryptocurrency.map((item) => (
                <div key={item.symbol} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={styles.itemSymbol}>{item.symbol}</span>
                  </div>
                  <div style={styles.cardBody}>
                    <span style={styles.itemPrice}>
                      {item.price} {item.unit}
                    </span>
                    <span
                      style={{
                        ...styles.itemChange,
                        color: item.change_percent >= 0 ? "#4caf50" : "#f44336"
                      }}
                    >
                      {item.change_percent}%
                    </span>
                  </div>
                  <div style={styles.itemTime}>
                    {item.time} - {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// استایل‌های inline برای شیشه‌ای و ریسپانسیو کردن نمایش
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    maxHeight: "100vh",
    overflowY: "auto",
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
    padding: "20px",
    boxSizing: "border-box",
    zIndex: 1000
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#fff",
    fontSize: "24px"
  },
  categoryContainer: {
    marginBottom: "30px"
  },
  categoryTitle: {
    color: "#fff",
    marginBottom: "10px",
    fontSize: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
    paddingBottom: "5px"
  },
  cardsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center"
  },
  card: {
    background: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "10px",
    padding: "10px",
    width: "calc(33.33% - 20px)",
    boxSizing: "border-box",
    minWidth: "200px",
    color: "#fff"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold",
    marginBottom: "5px"
  },
  cardBody: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px"
  },
  itemName: {
    fontSize: "16px"
  },
  itemSymbol: {
    fontSize: "14px",
    opacity: 0.8
  },
  itemPrice: {
    fontSize: "16px"
  },
  itemChange: {
    fontSize: "16px"
  },
  itemTime: {
    fontSize: "12px",
    opacity: 0.8,
    textAlign: "right"
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    padding: "20px"
  },
  error: {
    color: "#f44336",
    textAlign: "center",
    padding: "20px"
  }
};

export default MarketBoard;
