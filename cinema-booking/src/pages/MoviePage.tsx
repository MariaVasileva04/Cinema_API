import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pb } from '../api/pocketbase';

interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  overview: string;
  rating: number;
  genres: string[];
  ageRating: string;
  duration: number;
  releaseDate: string;
  director: string;
  cast: string[];
}

interface Session {
  id: string;
  movieId: string;
  date: string;
  time: string;
  format: string;
  hallId: string;
  price: number;
}

interface Hall {
  id: string;
  name: string;
  cinemaId: string;
}

interface Cinema {
  id: string;
  name: string;
  address: string;
  phone: string;
  metro: string;
  workingHours: string;
}

function MoviePage() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hall, setHall] = useState<Hall | null>(null);
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('Все');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);

        const movieData = await pb.collection('movies').getOne<Movie>(id);
        setMovie(movieData);

        const allSessions = await pb.collection('sessions').getFullList<Session>({
          sort: 'date, time',
        });

        // Фильтруем: только будущие сеансы этого фильма
        const now = new Date();
        const sessionsData = allSessions.filter((s) => {
          const sessionDateTime = new Date(`${s.date}T${s.time}`);
          return sessionDateTime > now && s.movieId === movieData.id;
        });

        setSessions(sessionsData);

        if (sessionsData.length > 0) {
          const firstHallId = sessionsData[0].hallId;
          const hallData = await pb.collection('halls').getOne<Hall>(firstHallId);
          setHall(hallData);

          try {
            const cinemaData = await pb.collection('cinemas').getOne<Cinema>(hallData.cinemaId);
            setCinema(cinemaData);
          } catch {
            // Кинотеатр не критичен
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const availableDates = Array.from(new Set(sessions.map((s) => s.date))).sort();
  const availableFormats = Array.from(new Set(sessions.map((s) => s.format))).sort();

  const filteredSessions = sessions.filter((session) => {
    const matchDate = !selectedDate || session.date === selectedDate;
    const matchFormat = selectedFormat === 'Все' || session.format === selectedFormat;
    return matchDate && matchFormat;
  });

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Фильм не найден</p>
          <Link to="/" className="text-[var(--accent)] hover:underline">
            ← На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Навигация */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            КИНО<span className="text-[var(--accent)]">.</span>
          </Link>
          <Link 
            to="/my-tickets" 
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Мои билеты
          </Link>
        </div>
      </nav>

      {/* Hero с backdrop */}
      <section className="relative h-[70vh] overflow-hidden">
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/70 to-transparent"></div>
        
        <div className="relative h-full max-w-7xl mx-auto px-6 flex items-end pb-12">
          <div className="animate-fade-up">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-6 transition-colors"
            >
              ← Назад
            </Link>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-none">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">★</span> 
                <span className="font-semibold">{movie.rating}</span>
              </span>
              <span className="text-[var(--text-muted)]">{movie.ageRating}</span>
              <span className="text-[var(--text-muted)]">{movie.duration} мин</span>
              <span className="text-[var(--text-muted)]">
                {new Date(movie.releaseDate).getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Контент */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Постер */}
          <div className="animate-fade-up">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full rounded-lg shadow-2xl"
            />
          </div>

          {/* Информация */}
          <div className="md:col-span-2 space-y-10 animate-fade-up">
            {/* Описание */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Описание</h2>
              <p className="text-[var(--text-muted)] leading-relaxed text-lg">
                {movie.overview}
              </p>
            </div>

            {/* Жанры */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Жанры</h2>
              <div className="flex flex-wrap gap-2">
                {movie.genres?.map((genre) => (
                  <span 
                    key={genre} 
                    className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Режиссёр и актёры */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-[var(--text-muted)] text-sm mb-2">Режиссёр</h3>
                <p className="font-semibold">{movie.director}</p>
              </div>
              <div>
                <h3 className="text-[var(--text-muted)] text-sm mb-2">В ролях</h3>
                <p className="font-semibold">{movie.cast?.join(', ')}</p>
              </div>
            </div>

            {/* Кинотеатр */}
            {cinema && (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">{cinema.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)]">📍</span>
                    <span>{cinema.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)]">🚇</span>
                    <span>м. {cinema.metro}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)]">📞</span>
                    <span>{cinema.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)]">🕐</span>
                    <span>{cinema.workingHours}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Расписание сеансов */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Расписание сеансов</h2>

              {sessions.length === 0 ? (
                <p className="text-[var(--text-muted)] text-center py-12">
                  Нет доступных сеансов
                </p>
              ) : (
                <>
                  {/* Даты */}
                  <div className="mb-6">
                    <h3 className="text-[var(--text-muted)] text-sm mb-3">Дата</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedDate === date
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          {new Date(date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            weekday: 'short',
                          })}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Форматы */}
                  <div className="mb-8">
                    <h3 className="text-[var(--text-muted)] text-sm mb-3">Формат</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Все', ...availableFormats].map((format) => (
                        <button
                          key={format}
                          onClick={() => setSelectedFormat(format)}
                          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedFormat === format
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Сеансы */}
                  {filteredSessions.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-center py-12">
                      Нет сеансов на выбранную дату
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {filteredSessions.map((session) => (
                        <Link
                          key={session.id}
                          to={`/booking/${movie.id}/${session.id}`}
                          className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg p-4 transition-colors text-center group"
                        >
                          <div className="text-xl font-bold mb-1 group-hover:text-[var(--accent)] transition-colors">
                            {session.time}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {session.format} • {session.price} ₽
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-[var(--border)] mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            КИНО. © 2026
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Учебный проект • React + PocketBase
          </p>
        </div>
      </footer>
    </div>
  );
}

export default MoviePage;