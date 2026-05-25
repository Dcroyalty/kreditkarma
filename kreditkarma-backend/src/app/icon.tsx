import { ImageResponse } from 'next/og';

export const size        = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'linear-gradient(135deg, #10b981, #059669)',
          borderRadius:   '7px',
          fontFamily:     'sans-serif',
          fontWeight:     900,
          fontSize:       18,
          color:          '#000',
          letterSpacing:  '-1px',
        }}
      >
        X
      </div>
    ),
    { ...size }
  );
}
