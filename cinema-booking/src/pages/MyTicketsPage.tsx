import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pb } from '../api/pocketbase';

interface Booking {
  id: string;
  movieTitle: string;
  sessionDate: string;
  sessionTime: string;
  sessionFormat: string;
  hallName: string;
  seats: string;
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  purchaseDate: string;
  rating?: number;
  reviewed?: boolean;
}


function StarRating({
  bookingId,
  existingRating = 0,
  onRated,
}: {
  bookingId: string;
  existingRating?: number;
  onRated?: (newRating: number) => void;
}) {
  const [rating, setRating] = useState(existingRating);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleClick = async (value: number) => {
    setRating(value);
    setSaving(true);
    try {
      await pb.collection('bookings').update(bookingId, {
        rating: value,
        reviewed: true,
      });
      onRated?.(value);
    } catch (error) {
      console.error( error);
      
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--text-muted)] mr-1">Оцените сеанс:</span>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hover || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={saving}
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-125 focus:outline-none disabled:opacity-50"
            aria-label={`${star} ${star === 1 ? 'звезда' : 'звёзд'}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isActive ? 'var(--accent)' : 'none'}
              stroke={isActive ? 'var(--accent)' : 'var(--text-muted)'}
              strokeWidth="1.5"
              className="drop-shadow-sm"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
      {saving && <span className="text-xs text-[var(--text-muted)]">сохраняем...</span>}
    </div>
  );
}
function MyTicketsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const records = await pb.collection('bookings').getFullList<Booking>({
          sort: 'purchaseDate',
        });
        setBookings(records as Booking[]);
      } catch (error) {
        console.error('Ошибка загрузки бронирований:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const parseSeats = (seatsStr: string) => {
    try {
      return JSON.parse(seatsStr);
    } catch {
      return [];
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот билет?')) return;

    try {
      await pb.collection('bookings').delete(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      alert('Не удалось удалить билет');
    }
  };


  const isPastBooking = (booking: Booking) => {
    const bookingDateTime = new Date(`${booking.sessionDate}T${booking.sessionTime}`);
    return bookingDateTime <= new Date();
  };


  const handleRated = (bookingId: string, newRating: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, rating: newRating, reviewed: true } : b
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            КИНО<span className="text-[var(--accent)]">.</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            На главную
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="mb-10 animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Мои билеты</h1>
          <p className="text-[var(--text-muted)]">
            {bookings.length}{' '}
            {bookings.length === 1
              ? 'покупка'
              : bookings.length < 5
              ? 'покупки'
              : 'покупок'}
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="text-6xl mb-4">🎟️</div>
            <p className="text-xl text-[var(--text-muted)] mb-6">
              У вас пока нет купленных билетов
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Выбрать фильм
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => {
              const seats = parseSeats(booking.seats);
              const past = isPastBooking(booking);

              return (
                <div
                  key={booking.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 animate-fade-up relative group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  
                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Удалить билет"
                  >
                    ✕
                  </button>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 pr-8">
                        <h3 className="text-xl font-bold">{booking.movieTitle}</h3>
                        
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                        <span>
                          📅{' '}
                          {new Date(booking.sessionDate).toLocaleDateString('ru-RU', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
                        <span>🕐 {booking.sessionTime}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
                        <span>{booking.sessionFormat}</span>
                      </div>
                      <div className="mt-3 text-sm">
                        <span className="text-[var(--text-muted)]">Места: </span>
                        <span className="font-medium">
                          {seats
                            .map((s: any) => `Ряд ${s.row}, Место ${s.seat}`)
                            .join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-2xl font-bold text-[var(--text)]">
                        {booking.totalPrice} ₽
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Куплено{' '}
                        {new Date(booking.purchaseDate).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>

                  {/* Блок с отзывом — только для прошедших сеансов */}
                  {past && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <StarRating
                        bookingId={booking.id}
                        existingRating={booking.rating}
                        onRated={(newRating) => handleRated(booking.id, newRating)}
                      />
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
                    <div>
                      <span className="text-[var(--text-muted)]">Покупатель: </span>
                      <span className="text-[var(--text)]">{booking.customerName}</span>
                    </div>
                    <div>
                      <span>{booking.customerEmail}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--text-muted)]">КИНО. © 2026</p>
          <p className="text-xs text-[var(--text-muted)]">Vasileva M. A.</p>
        </div>
      </footer>
    </div>
  );
}

export default MyTicketsPage;