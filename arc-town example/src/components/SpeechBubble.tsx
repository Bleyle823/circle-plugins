import { useCallback, useMemo } from 'react';
import { Container, Graphics, Sprite, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';
import usdcLogoUrl from '../../assets/ui/usdc.png';
import { isUsdcTransaction } from '../lib/usdcMessage';

const BUBBLE_STYLE = new PIXI.TextStyle({
  fontFamily: 'Arial, sans-serif',
  fontSize: 11,
  fill: '#23202b',
  wordWrap: true,
  wordWrapWidth: 110,
  align: 'center',
  lineHeight: 14,
});

const PADDING = { x: 10, y: 6 };
const TAIL_HEIGHT = 6;
const MAX_CHARS = 100;
const USDC_ICON_SIZE = 18;

const usdcTexture = PIXI.Texture.from(usdcLogoUrl);

export function SpeechBubble({ text, anchorY = -30 }: { text: string; anchorY?: number }) {
  const showUsdc = isUsdcTransaction(text);

  const displayText = useMemo(() => {
    if (text === '...') {
      return text;
    }
    return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS - 1)}…` : text;
  }, [text]);

  const metrics = useMemo(
    () => PIXI.TextMetrics.measureText(displayText, BUBBLE_STYLE),
    [displayText],
  );

  const bubbleWidth = Math.min(130, Math.max(metrics.width + PADDING.x * 2, 28));
  const bubbleHeight = metrics.height + PADDING.y * 2;
  const bubbleTop = anchorY - bubbleHeight - TAIL_HEIGHT - (showUsdc ? USDC_ICON_SIZE + 4 : 0);

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();
      g.lineStyle(2, 0x4a3b5b, 1);
      g.beginFill(0xffffff, 0.95);
      g.drawRoundedRect(-bubbleWidth / 2, bubbleTop, bubbleWidth, bubbleHeight, 6);
      g.moveTo(-5, anchorY - TAIL_HEIGHT);
      g.lineTo(0, anchorY);
      g.lineTo(5, anchorY - TAIL_HEIGHT);
      g.closePath();
      g.endFill();
    },
    [anchorY, bubbleHeight, bubbleTop, bubbleWidth],
  );

  return (
    <Container>
      {showUsdc && (
        <Sprite
          texture={usdcTexture}
          anchor={{ x: 0.5, y: 1 }}
          x={0}
          y={bubbleTop - 2}
          width={USDC_ICON_SIZE}
          height={USDC_ICON_SIZE}
        />
      )}
      <Graphics draw={draw} />
      <Text
        text={displayText}
        style={BUBBLE_STYLE}
        anchor={{ x: 0.5, y: 0.5 }}
        x={0}
        y={bubbleTop + bubbleHeight / 2}
      />
    </Container>
  );
}
