import { useCallback, useRef, useState, type DragEvent } from 'react';

interface Props {
  onFiles: (files: FileList) => void;
  hasFiles: boolean;
}

export default function DropZone({ onFiles, hasFiles }: Props) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      stop(e);
      setOver(false);
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    },
    [stop, onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="이미지 파일을 드래그하거나 클릭해서 선택"
      onDragOver={(e) => { stop(e); setOver(true); }}
      onDragEnter={(e) => { stop(e); setOver(true); }}
      onDragLeave={(e) => { stop(e); setOver(false); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      className={`glass-2 ${over ? 'dropzone-active' : 'dropzone-idle'}`}
      style={{
        borderRadius: 'var(--r-2xl)',
        cursor: 'pointer',
        padding: hasFiles ? '28px 24px' : '80px 24px',
        transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        outline: 'none',
        userSelect: 'none',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: hasFiles ? 12 : 22,
      }}>
        {/* Upload icon */}
        <div style={{
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: over ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
        }}>
          <div style={{
            width: hasFiles ? 48 : 68,
            height: hasFiles ? 48 : 68,
            borderRadius: hasFiles ? 14 : 20,
            background: over
              ? 'linear-gradient(135deg, rgba(232,160,48,0.22), rgba(232,160,48,0.08))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            border: over
              ? '1px solid rgba(232,160,48,0.4)'
              : '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: over
              ? '0 0 40px rgba(232,160,48,0.18), inset 0 1px 0 rgba(232,160,48,0.25)'
              : '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            {hasFiles ? (
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={over ? 'var(--accent)' : 'rgba(255,255,255,0.5)'}
                strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'stroke 0.2s ease' }}
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            ) : (
              <svg
                width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={over ? 'var(--accent)' : 'rgba(255,255,255,0.45)'}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'stroke 0.2s ease' }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: hasFiles ? 16 : 20,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: over ? 'var(--accent)' : 'rgba(240,243,250,0.95)',
            transition: 'color 0.2s ease',
            marginBottom: hasFiles ? 0 : 7,
          }}>
            {hasFiles
              ? (over ? '여기에 놓으세요' : '이미지 추가')
              : (over ? '여기에 놓으세요' : '이미지를 드래그하거나 클릭')}
          </p>
          {!hasFiles && (
            <p style={{
              fontSize: 15,
              color: 'var(--text-tertiary)',
              letterSpacing: '-0.005em',
            }}>
              JPG · PNG · WebP · GIF · BMP · SVG
            </p>
          )}
        </div>

        {/* Privacy badge */}
        {!hasFiles && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 100,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 13,
            color: 'var(--text-muted)',
            fontWeight: 500,
            letterSpacing: '0.02em',
            marginTop: 4,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            브라우저에서만 처리 · 서버 전송 없음
          </div>
        )}
      </div>
    </div>
  );
}
