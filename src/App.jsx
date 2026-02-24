import { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Search, Download, Edit3, MapPin, Calendar, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import './App.css';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1FYmISvIqShClvASdrLkw6B0K0o77wyoClk-J5PxBt-o/export?format=csv&id=1FYmISvIqShClvASdrLkw6B0K0o77wyoClk-J5PxBt-o&gid=0';
const FORM_LINK = 'https://docs.google.com/forms/d/e/1FAIpQLSdPdrIf_PTO0Wa7lMVGKHMrKvVgROIIl06NQjzC8zgbxPGFXg/viewform';
const MAPS_LINK = 'https://maps.app.goo.gl/rywjvqfSXoCxEja19?g_st=ic';
const CALENDAR_LINK = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=%DB%8C%D8%A7%D8%AF%D9%85%D8%A7%D9%86%D9%90+%D8%AC%D8%A7%D9%88%DB%8C%D8%AF%D9%86%D8%A7%D9%85%D8%A7%D9%86&details=%D9%85%DB%8C%D8%B9%D8%A7%D8%AF%DA%AF%D8%A7%D9%87%DB%8C+%D8%A8%D8%B1%D8%A7%DB%8C+%D8%AA%D8%AC%D8%AF%DB%8C%D8%AF+%D8%B9%D9%87%D8%AF+%D8%A8%D8%A7+%D8%AE%D8%A7%D9%81%D9%88%D8%A7%D8%AF%D9%87%E2%80%8C%D9%87%D8%A7%DB%8C+%D8%B3%D8%B1%D8%A7%D9%81%D8%B1%D8%A7%D8%B2+%D9%88+%D8%B2%D9%86%D8%AF%D9%87+%D9%86%DA%AF%D9%87+%D8%AF%D8%A7%D8%B3%D8%AA%D9%86+%DB%8C%D8%A7%D8%AF+%D8%AC%D8%A7%D9%88%DB%8C%D8%AF%D9%86%D8%A7%D9%85%D8%A7%D9%86+%D9%88+%D8%AC%D8%A7%D9%81+%D9%81%D8%AF%D8%A7%DB%8C%D8%A7%D9%86+%D8%B1%D8%A7%D9%87+%D9%85%DB%8C%D9%87%D9%86.+%D8%AC%D9%85%D8%B9%D9%87%E2%80%8C%D9%87%D8%A7%D8%8C+%DB%8C%D8%A7%D8%AF%D9%85%D8%A7%D9%86%D9%90+%D8%A2%D9%86%D8%A7%D9%86+%DA%A9%D9%87+%D9%85%D8%A7%D9%86%D8%AF%DA%AF%D8%A7%D8%B1+%D8%B4%D8%AF%D9%86%D8%AF.&location=%D8%A8%D9%87%D8%B4%D8%AA+%D8%B2%D9%87%D8%B1%D8%A7%D8%8C+%D8%AA%D9%87%D8%B1%D8%A7%D9%86%D8%8C+%D9%82%D8%B7%D8%B1%D9%87+%DB%B3%DB%B2%DB%B7&dates=20260227T100000/20260227T110000&recur=RRULE:FREQ%3DWEEKLY%3BBYDAY%3DFR&ctz=Asia/Tehran';

const ROTATION_INTERVAL_MS = 9000; // 9 seconds per card

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for scorecard rotation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  // State for mobile menu
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        Papa.parse(SHEET_CSV_URL, {
          download: true,
          header: true,
          complete: (results) => {
            const validData = results.data.filter(
              row => row['جاویدنام'] || row['یادگار / کلام'] || row['قطعه']
            );

            // Shuffle array
            const shuffled = [...validData];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            setData(shuffled);
            setLoading(false);
          },
          error: (err) => {
            console.error('Error parsing CSV:', err);
            setError('خطا در دریافت اطلاعات.');
            setLoading(false);
          }
        });
      } catch (e) {
        console.error('Fetch exception:', e);
        setError('خطای غیرمنتظره در دریافت اطلاعات.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data
  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      (item['جاویدنام'] && item['جاویدنام'].toLowerCase().includes(term)) ||
      (item['یادگار / کلام'] && item['یادگار / کلام'].toLowerCase().includes(term)) ||
      (item['قطعه'] && item['قطعه'].toLowerCase().includes(term))
    );
  });

  // Carousel swipe and nav controls
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // In RTL, left swipe goes to next, right swipe goes to prev
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      if (filteredData.length === 0) return prev;
      return (prev + 1) % filteredData.length;
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      if (filteredData.length === 0) return prev;
      return (prev - 1 + filteredData.length) % filteredData.length;
    });
  };

  // Adjust current index if we filter out the current item during render
  const safeIndex = (currentIndex >= filteredData.length && filteredData.length > 0) ? 0 : currentIndex;

  if (safeIndex !== currentIndex) {
    setCurrentIndex(safeIndex);
  }

  // Handle Scorecard Rotation
  useEffect(() => {
    if (loading || filteredData.length === 0 || isPaused || searchTerm.length > 0) {
      // Return early if searching or paused without setting state sync
      return;
    }

    // Reset progress when index changes
    const startTime = Date.now();

    // Animate progress bar
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / ROTATION_INTERVAL_MS) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        setCurrentIndex(prev => (prev + 1) % filteredData.length);
      }
    }, 50);

    return () => clearInterval(progressIntervalRef.current);
  }, [safeIndex, filteredData.length, loading, isPaused, searchTerm]);

  // PDF Export Link
  const EXPORT_URL = 'https://docs.google.com/spreadsheets/d/1FYmISvIqShClvASdrLkw6B0K0o77wyoClk-J5PxBt-o/export?format=pdf&gid=0&size=A4&portrait=true&fitw=true&top_margin=0.25&bottom_margin=0.25&left_margin=0.25&right_margin=0.25&sheetnames=true&printtitle=true&pagenumbers=false&pagenum=UNDEFINED&attachment=true';

  const getImageUrl = (person) => {
    // Find a property that looks like a URL (since the column name might be anything)
    const imgKey = Object.keys(person).find(k =>
      person[k] && person[k].toString().startsWith('http')
    );
    return imgKey ? person[imgKey] : null;
  };

  const currentPerson = filteredData[safeIndex];
  const imageUrl = currentPerson ? getImageUrl(currentPerson) : null;

  return (
    <div className="app-layout">
      {/* Background Cedar Graphic */}
      <div className="cedar-bg"></div>

      {/* Top Navigation */}
      <header className="top-bar">
        <div className="brand">
          <a href="https://sarv.info/" className="brand-header" style={{ textDecoration: 'none' }}>
            <img src="https://i.ibb.co/LzSWF0kW/output-onlinepngtools.png" alt="نشانی سرو" className="brand-logo" />
            <div className="brand-title">نشانی مزار جاویدنامان</div>
          </a>
          <div className="brand-poem">
            <span className="poem-line">ساحت گور تو <span className="sarv">سروستان</span> شد، </span>
            <span className="poem-line">ای عزیز دل من، تو کدامین <span className="sarv">سروی؟</span></span>
          </div>
        </div>

        <div className="header-actions">
          {/* Desktop Search */}
          <form className="search-mini desktop-only" onSubmit={(e) => e.preventDefault()}>
            <Search size={16} />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            />
          </form>

          <a href={EXPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary desktop-only" style={{ border: '1px solid var(--color-gold)' }}>
            <Download size={16} /> <span>لیست نشانی‌ها</span>
          </a>

          <a href={FORM_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-secondary desktop-only">
            <Edit3 size={16} /> <span>افزودن/ویرایش نشانی</span>
          </a>

          <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-secondary desktop-only">
            <MapPin size={16} /> <span>مسیریابی به قطعه ۳۲۷</span>
          </a>

          <a href={CALENDAR_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-secondary desktop-only text-gold">
            <Calendar size={16} /> <span>افزودن به تقویم</span>
          </a>

          {/* Mobile Header Icons - Persistent */}
          <button
            className="icon-btn mobile-only text-gold"
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              setMenuOpen(false);
            }}
            aria-label="Search"
          >
            <Search size={22} />
          </button>

          <a href={EXPORT_URL} target="_blank" rel="noopener noreferrer" className="icon-btn mobile-only text-gold" aria-label="Download">
            <Download size={22} />
          </a>

          <button
            className="mobile-menu-toggle mobile-only"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setMobileSearchOpen(false);
            }}
            aria-label="Toggle Menu"
          >
            <div className={`hamburger ${menuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Mobile Search Dropdown */}
        {mobileSearchOpen && (
          <form className="mobile-search-dropdown mobile-only" onSubmit={(e) => e.preventDefault()}>
            <Search size={18} />
            <input
              autoFocus
              type="text"
              placeholder="جستجوی نام، قطعه، یادگار..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            />
          </form>
        )}

        {/* Mobile Hamburger Menu Content */}
        <div className={`controls-mobile mobile-only ${menuOpen ? 'controls-open' : ''}`}>
          <a href={EXPORT_URL} target="_blank" rel="noopener noreferrer" className="mobile-menu-item" style={{ fontWeight: 'bold' }}>
            <Download size={18} /> <span>لیست کامل نشانی‌ها</span>
          </a>

          <a href={CALENDAR_LINK} target="_blank" rel="noopener noreferrer" className="mobile-menu-item text-gold">
            <Calendar size={18} /> <span>افزودن به تقویم جمعه‌ها</span>
          </a>

          <a href={FORM_LINK} target="_blank" rel="noopener noreferrer" className="mobile-menu-item">
            <Edit3 size={18} /> <span>افزودن/ویرایش نشانی</span>
          </a>

          <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="mobile-menu-item">
            <MapPin size={18} /> <span>مسیریابی به قطعه ۳۲۷</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-stage">
        {loading ? (
          <div className="centered-state">
            <div className="spinner"></div>
            <p className="mt-4">در حال بازخوانی...</p>
          </div>
        ) : error ? (
          <div className="centered-state text-red">
            <p>{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="centered-state">
            <p>سروی یافت نشد.</p>
          </div>
        ) : (
          <div
            className="scorecard-wrapper animate-slide-up"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              if (searchTerm.length === 0) setIsPaused(false);
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {filteredData.length > 1 && (
              <button
                className="carousel-nav-btn prev-btn"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                aria-label="قبلی"
              >
                <ChevronRight size={24} />
              </button>
            )}

            <div className="scorecard" key={safeIndex}>
              <div className="scorecard-image">
                {imageUrl ? (
                  <img src={imageUrl} alt={currentPerson['جاویدنام']} />
                ) : (
                  <div className="image-fallback">
                    <span style={{ opacity: 0.3 }}>بدون تصویر</span>
                  </div>
                )}
              </div>

              <div className="scorecard-content">
                <div className="scorecard-pre">فرزند ایران و جان فدای میهن</div>
                <h2 className="scorecard-name">{currentPerson['جاویدنام'] || 'جاویدنام'}</h2>

                <div className="scorecard-details">
                  <div className="detail-item">
                    <span className="detail-label">قطعه</span>
                    <span className="detail-val">{currentPerson['قطعه'] || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ردیف</span>
                    <span className="detail-val">{currentPerson['ردیف'] || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">شماره</span>
                    <span className="detail-val">{currentPerson['شماره'] || '-'}</span>
                  </div>
                </div>

                {currentPerson['یادگار / کلام'] && (
                  <div className="scorecard-quote text-gold">
                    « {currentPerson['یادگار / کلام']} »
                  </div>
                )}
              </div>

              {/* Progress bar at the bottom mapping the rotation time */}
              {searchTerm.length === 0 && (
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
              )}
            </div>

            {filteredData.length > 1 && (
              <button
                className="carousel-nav-btn next-btn"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                aria-label="بعدی"
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="footer-container">
        <div className="footer-content">
          <span>نشانی سرو • یادگار جاویدان</span>
          <a href="mailto:sarvinfo@mail.com" className="footer-email">
            <span dir="ltr">sarvinfo@mail.com</span> <Mail size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
