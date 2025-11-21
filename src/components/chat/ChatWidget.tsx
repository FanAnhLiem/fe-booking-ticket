// src/components/chat/ChatWidget.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_API = 'http://localhost:8080/api';
const CHATBOT_API = `${BASE_API}/chatbot/chat`;

interface ChatbotPayload {
  type: string;
  message?: string;
  reply?: string;
  answer?: string;
  content?: string;

  movie?: any | null;      // MovieDto
  cinema?: any | null;     // CinemaDto
  screen?: any | null;     // ScreenRoomDto
  movies?: any[] | null;
  cinemas?: any[] | null;
  screens?: any[] | null;
  types?: any[] | null;    // ScreenRoomTypeDto[]
  showtimes?: any[] | null; // ShowTimeDto[]

  [key: string]: any;
}

type Sender = 'user' | 'bot';

interface ChatMessage {
  id: number;
  sender: Sender;
  text: string;
  data?: ChatbotPayload | null;
  createdAt: Date;
}

// ===== Helpers =====
const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const extractBotText = (res: ChatbotPayload | null | undefined): string => {
  if (!res) return 'Tôi chưa có câu trả lời phù hợp.';
  return (
    res.message ||
    res.reply ||
    res.answer ||
    res.content ||
    'Tôi chưa có câu trả lời phù hợp.'
  );
};

const labelFromKey = (key: string) => {
  if (!key) return '';
  if (key === 'movie' || key === 'movies') return 'Thông tin phim';
  if (key === 'cinema' || key === 'cinemas') return 'Thông tin rạp';
  if (key === 'screen' || key === 'screens') return 'Phòng chiếu';
  if (key === 'showtimes') return 'Suất chiếu';
  if (key === 'types') return 'Loại phòng';

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};

const renderObjectItem = (obj: any) => {
  if (!obj || typeof obj !== 'object') return String(obj);

  const name = obj.name || obj.movieName || obj.cinemaName || obj.screenName;

  return (
    <span className="text-[14px] text-slate-700">
      {name ? `${name}: ` : ''}
      {JSON.stringify(obj, null, 0)}
    </span>
  );
};

// ================== CARD CHO TỪNG DTO ==================

// MovieDto: name, description, category, country, ageLimit, duration,
// director, actors, releaseDate, posterUrl, active
const MovieCard = ({ movie }: { movie: any }) => {
  if (!movie) return null;

  const {
    name,
    description,
    category,
    country,
    ageLimit,
    duration,
    director,
    actors,
    releaseDate,
    posterUrl,
    active,
  } = movie as {
    name?: string;
    description?: string;
    category?: string;
    country?: string;
    ageLimit?: number | string;
    duration?: string;
    director?: string;
    actors?: string;
    releaseDate?: string;
    posterUrl?: string;
    active?: string;
  };

  const ageText =
    ageLimit !== undefined && ageLimit !== null ? `${ageLimit}+` : '';

  return (
    <div className="bg-slate-50 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex gap-4">
        {posterUrl && (
          <div className="flex-shrink-0 w-32 h-48 overflow-hidden rounded-xl bg-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt={name || 'Poster phim'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 text-[15px] leading-relaxed text-slate-800 space-y-1">
          {name && (
            <h4 className="text-[17px] font-bold mb-1 uppercase">{name}</h4>
          )}
          {duration && (
            <p>
              <span className="font-semibold">Thời lượng:</span> {duration}
            </p>
          )}
          {country && (
            <p>
              <span className="font-semibold">Quốc gia:</span> {country}
            </p>
          )}
          {category && (
            <p>
              <span className="font-semibold">Thể loại:</span> {category}
            </p>
          )}
          {ageText && (
            <p>
              <span className="font-semibold">Giới hạn tuổi:</span> {ageText}
            </p>
          )}
          {releaseDate && (
            <p>
              <span className="font-semibold">Khởi chiếu:</span> {releaseDate}
            </p>
          )}
          {director && (
            <p>
              <span className="font-semibold">Đạo diễn:</span> {director}
            </p>
          )}
          {actors && (
            <p>
              <span className="font-semibold">Diễn viên:</span> {actors}
            </p>
          )}
          {active && (
            <p>
              <span className="font-semibold">Trạng thái:</span> {active}
            </p>
          )}
        </div>
      </div>

      {description && (
        <div className="mt-2 bg-white rounded-xl p-3 text-[15px] leading-relaxed text-slate-700 max-h-64 overflow-y-auto">
          {description}
        </div>
      )}
    </div>
  );
};

// CinemaDto: name, cinemaType, address, active, numberOfScreens
const CinemaCard = ({ cinema }: { cinema: any }) => {
  if (!cinema) return null;
  const { name, cinemaType, address, active, numberOfScreens } = cinema as {
    name?: string;
    cinemaType?: string;
    address?: string;
    active?: string;
    numberOfScreens?: number;
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 shadow-sm text-[15px] leading-relaxed text-slate-800 space-y-1">
      {name && <h4 className="text-[17px] font-bold mb-1">{name}</h4>}
      {cinemaType && (
        <p>
          <span className="font-semibold">Loại rạp:</span> {cinemaType}
        </p>
      )}
      {address && (
        <p>
          <span className="font-semibold">Địa chỉ:</span> {address}
        </p>
      )}
      {typeof numberOfScreens === 'number' && (
        <p>
          <span className="font-semibold">Số phòng chiếu:</span>{' '}
          {numberOfScreens}
        </p>
      )}
      {active && (
        <p>
          <span className="font-semibold">Trạng thái:</span> {active}
        </p>
      )}
    </div>
  );
};

// ScreenRoomDto: name, cinemaName, roomType, seatCount, active
const ScreenRoomCard = ({ room }: { room: any }) => {
  if (!room) return null;
  const { name, cinemaName, roomType, seatCount, active } = room as {
    name?: string;
    cinemaName?: string;
    roomType?: string;
    seatCount?: number;
    active?: string;
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 shadow-sm text-[15px] leading-relaxed text-slate-800 space-y-1">
      {name && <h4 className="text-[17px] font-bold mb-1">{name}</h4>}
      {cinemaName && (
        <p>
          <span className="font-semibold">Rạp:</span> {cinemaName}
        </p>
      )}
      {roomType && (
        <p>
          <span className="font-semibold">Loại phòng:</span> {roomType}
        </p>
      )}
      {typeof seatCount === 'number' && (
        <p>
          <span className="font-semibold">Số ghế:</span> {seatCount}
        </p>
      )}
      {active && (
        <p>
          <span className="font-semibold">Trạng thái:</span> {active}
        </p>
      )}
    </div>
  );
};

// ScreenRoomTypeDto: name
const ScreenRoomTypeList = ({ types }: { types: any[] }) => {
  if (!types || types.length === 0) return null;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 shadow-sm text-[15px]">
      <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide mb-2">
        Loại phòng
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((t, idx) => (
          <span
            key={idx}
            className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[14px]"
          >
            {t?.name ?? 'Không rõ'}
          </span>
        ))}
      </div>
    </div>
  );
};

// ShowTimeDto: id, movieName, cinemaName, screenName, showDate, startTime, endTime
const ShowtimeList = ({ showtimes }: { showtimes: any[] }) => {
  if (!showtimes || showtimes.length === 0) return null;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 shadow-sm space-y-2 text-[15px]">
      <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
        Suất chiếu
      </div>
      <ul className="space-y-2">
        {showtimes.map((st, idx) => {
          const {
            movieName,
            cinemaName,
            screenName,
            showDate,
            startTime,
            endTime,
          } = st as {
            movieName?: string;
            cinemaName?: string;
            screenName?: string;
            showDate?: string;
            startTime?: string;
            endTime?: string;
          };

          return (
            <li
              key={idx}
              className="flex flex-col md:flex-row md:items-center md:justify-between border border-slate-200 rounded-xl px-3 py-2 bg-white"
            >
              <div className="font-semibold text-slate-800">
                {startTime && <span>{startTime}</span>}
                {endTime && <span> - {endTime}</span>}
                {showDate && (
                  <span className="text-slate-500"> • {showDate}</span>
                )}
              </div>
              <div className="text-[14px] text-slate-600 mt-1 md:mt-0">
                {movieName && <span>{movieName}</span>}
                {(cinemaName || screenName) && (
                  <span className="ml-1 text-slate-500">
                    ({cinemaName}
                    {cinemaName && screenName ? ' - ' : ''}
                    {screenName})
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ================== COMPONENT CHÍNH ==================
const ChatWidget = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const token = getAccessToken();
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, sending]);

  const addMessage = (
    sender: Sender,
    text: string,
    data?: ChatbotPayload | null,
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId.current++,
        sender,
        text,
        data: data ?? undefined,
        createdAt: new Date(),
      },
    ]);
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleStart = async () => {
    const token = getAccessToken();
    if (!token) {
      const current =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/';
      router.push(`/login?redirect=${encodeURIComponent(current)}`);
      return;
    }

    setStarted(true);
    setError(null);
    await sendMessage('Bắt đầu', { showUserBubble: true });
  };

  const sendMessage = async (
    content: string,
    options?: { showUserBubble?: boolean },
  ) => {
    const { showUserBubble = true } = options || {};
    const token = getAccessToken();

    if (!token) {
      const current =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/';
      router.push(`/login?redirect=${encodeURIComponent(current)}`);
      return;
    }

    if (!content.trim()) return;

    setError(null);
    if (showUserBubble) {
      addMessage('user', content);
    }

    try {
      setSending(true);

      const res = await fetch(CHATBOT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content }),
      });

      const raw = await res.text();

      if (!res.ok) {
        throw new Error(raw || 'Chatbot đang gặp lỗi.');
      }
      if (!raw) {
        throw new Error('Chatbot không trả về dữ liệu.');
      }

      let payload: ChatbotPayload;
      try {
        payload = JSON.parse(raw) as ChatbotPayload;
      } catch (e) {
        console.error('Chatbot trả về JSON không hợp lệ:', raw);
        throw new Error('Dữ liệu chatbot không hợp lệ.');
      }

      const botText = extractBotText(payload);
      addMessage('bot', botText, payload);
    } catch (e: any) {
      console.error('Chatbot error:', e);
      setError(e.message || 'Có lỗi xảy ra khi chat. Vui lòng thử lại.');
      addMessage(
        'bot',
        'Xin lỗi, tôi đang gặp một chút sự cố. Bạn thử lại sau nhé.',
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    sendMessage(input.trim());
    setInput('');
  };

  const loginRequiredView = useMemo(() => {
    if (isLoggedIn === null) return null;
    if (isLoggedIn) return null;

    const redirect =
      typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/';

    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-6 py-4 text-[15px] bg-slate-50">
        <p className="text-slate-700 mb-3">
          Bạn cần đăng nhập để sử dụng trợ lý ảo.
        </p>
        <button
          type="button"
          onClick={() =>
            router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
          }
          className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }, [isLoggedIn, router]);

  // render chi tiết DTO theo từng loại
  const renderBotExtra = (data?: ChatbotPayload | null) => {
    if (!data || typeof data !== 'object') return null;

    // 1. Movie + showtimes
    if (data.movie) {
      return (
        <div className="mt-3 space-y-3 text-[15px]">
          <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
            Thông tin phim
          </div>
          <MovieCard movie={data.movie} />
          {Array.isArray(data.showtimes) && data.showtimes.length > 0 && (
            <ShowtimeList showtimes={data.showtimes} />
          )}
        </div>
      );
    }

    // 2. Danh sách phim
    if (Array.isArray(data.movies) && data.movies.length > 0) {
      return (
        <div className="mt-3 space-y-3 text-[15px]">
          <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
            Danh sách phim
          </div>
          {data.movies.map((mv, idx) => (
            <MovieCard key={idx} movie={mv} />
          ))}
        </div>
      );
    }

    // 3. Cinema / cinemas
    if (data.cinema || (Array.isArray(data.cinemas) && data.cinemas.length)) {
      const cinemas = data.cinema
        ? [data.cinema]
        : (data.cinemas as any[]);

      return (
        <div className="mt-3 space-y-3 text-[15px]">
          <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
            Thông tin rạp
          </div>
          {cinemas.map((c, idx) => (
            <CinemaCard key={idx} cinema={c} />
          ))}
        </div>
      );
    }

    // 4. Screen / screens
    if (data.screen || (Array.isArray(data.screens) && data.screens.length)) {
      const screens = data.screen ? [data.screen] : (data.screens as any[]);

      return (
        <div className="mt-3 space-y-3 text-[15px]">
          <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
            Thông tin phòng chiếu
          </div>
          {screens.map((s, idx) => (
            <ScreenRoomCard key={idx} room={s} />
          ))}
        </div>
      );
    }

    // 5. Loại phòng (ScreenRoomTypeDto[])
    if (Array.isArray(data.types) && data.types.length > 0) {
      return (
        <div className="mt-3 text-[15px]">
          <ScreenRoomTypeList types={data.types} />
        </div>
      );
    }

    // 6. Showtimes độc lập
    if (Array.isArray(data.showtimes) && data.showtimes.length > 0) {
      return (
        <div className="mt-3 space-y-2 text-[15px]">
          <ShowtimeList showtimes={data.showtimes} />
        </div>
      );
    }

    // 7. Fallback generic cho các field khác (nếu có)
    const keys = Object.keys(data).filter((k) => {
      if (['type', 'reply', 'message', 'answer', 'content'].includes(k)) {
        return false;
      }
      const v = (data as any)[k];
      if (v === null || v === undefined) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    });

    if (keys.length === 0) return null;

    return (
      <div className="mt-3 space-y-2 text-[15px]">
        {keys.map((key) => {
          const val = (data as any)[key];
          if (val === null || val === undefined) return null;

          if (Array.isArray(val)) {
            if (val.length === 0) return null;
            return (
              <div key={key} className="bg-slate-50 rounded-2xl px-3 py-2">
                <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide mb-1">
                  {labelFromKey(key)}
                </div>
                <ul className="space-y-1">
                  {val.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-[14px] text-slate-700 border-b border-slate-100 last:border-b-0 pb-1 last:pb-0"
                    >
                      {renderObjectItem(item)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          if (typeof val === 'object') {
            return (
              <div key={key} className="bg-slate-50 rounded-2xl px-3 py-2">
                <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide mb-1">
                  {labelFromKey(key)}
                </div>
                <div className="text-[14px] text-slate-700">
                  {renderObjectItem(val)}
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="text-[14px] text-slate-700">
              <span className="font-semibold mr-1">{labelFromKey(key)}:</span>
              <span>{String(val)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-3 w-[640px] max-w-[95vw] h-[80vh] max-h-[80vh] rounded-3xl shadow-2xl flex flex-col bg-white border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
              CB
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[15px]">PHENIKAA CINE BOT</div>
              <div className="text-[12px] text-blue-100">
                Hỗ trợ đặt vé &amp; tìm kiếm thông tin theo yêu cầu
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 flex flex-col bg-slate-50">
            {loginRequiredView ? (
              loginRequiredView
            ) : !started ? (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-4 text-center text-[15px]">
                <p className="text-slate-800 font-semibold mb-2 text-[16px]">
                  Xin chào 👋
                </p>
                <p className="text-slate-600 mb-4 text-[14px]">
                  Tôi là trợ lý ảo của hệ thống đặt vé. Bấm &quot;Bắt đầu
                  chat&quot; để tôi hỗ trợ bạn về phim, suất chiếu, giá vé, khuyến
                  mãi,...
                </p>
                <button
                  type="button"
                  onClick={handleStart}
                  className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
                >
                  Bắt đầu chat
                </button>
              </div>
            ) : (
              <>
                {/* Chat messages */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                        }`}
                      >
                        <div>{m.text}</div>
                        {m.sender === 'bot' && renderBotExtra(m.data)}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white border border-slate-200 text-[13px] text-slate-500">
                        <span>Đang soạn câu trả lời</span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {error && (
                  <div className="px-4 pb-1 text-[12px] text-red-500">
                    {error}
                  </div>
                )}

                {/* Input */}
                <form
                  onSubmit={handleSubmit}
                  className="border-t border-slate-200 bg-white px-3 py-2 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 text-[15px] border border-slate-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${
                      sending || !input.trim()
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    ➤
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Nút mở chat */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-14 h-14 rounded-full bg-blue-600 shadow-xl flex items-center justify-center text-white text-2xl hover:bg-blue-700"
      >
        💬
      </button>
    </div>
  );
};

export default ChatWidget;
