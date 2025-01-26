/// <reference types="vite-plugin-svgr/client" />
import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import JetLagBadge from "./assets/JetLagLogo.svg?react";
import FontFaceObserver from "fontfaceobserver";
import "unfonts.css";

interface CardDisplayProps {
  card: JetLagCard;
  setIsLoading: (loading: boolean) => void;
  className?: string;
  canvasRef: React.MutableRefObject<fabric.StaticCanvas | null>;
}

interface CardEditorProps {
  card: JetLagCard;
  onEdit: (card: JetLagCard) => void;
  onDownload: (type: "Image" | "Card") => void;
  disabled?: boolean;
}

enum CardType {
  NormalChallenge,
  NormalCurse,
  HideAndSeekCurse,
}

interface JetLagCard {
  type: CardType;
  upper: string;
  lower: string;
  body: string;
}

function useFontLoader(
  fontFamily: string,
  options?: FontFaceObserver.FontVariant[]
) {
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  useEffect(() => {
    const loadFont = async () => {
      try {
        if (Array.isArray(options)) {
          const promises = options.map((option) => {
            const font = new FontFaceObserver(fontFamily, option);
            return font.load();
          });
          await Promise.all(promises);
          setIsFontLoaded(true);
        } else {
          const font = new FontFaceObserver(fontFamily, options);
          await font.load();
          setIsFontLoaded(true);
        }
      } catch (error) {
        console.error(`Failed to load font: ${fontFamily}`, error);
        setIsFontLoaded(false);
      }
    };

    loadFont();
  }, [fontFamily, options]);

  return isFontLoaded;
}

function getBackground(cardType: CardType) {
  switch (cardType) {
    case CardType.NormalChallenge:
      return new URL("./assets/CardBackground-03.png", import.meta.url).href;
    case CardType.NormalCurse:
      return new URL("./assets/CardBackground-01.png", import.meta.url).href;
    case CardType.HideAndSeekCurse:
      return new URL("./assets/CardBackground-02.png", import.meta.url).href;
  }
}

async function buildBackground(card: JetLagCard, canvas: fabric.StaticCanvas) {
  const background = await fabric.FabricImage.fromURL(getBackground(card.type));
  background.scaleToHeight(canvas.height!);
  background.scaleToWidth(canvas.width!);
  canvas.backgroundImage = background;
  canvas.renderAll();
}

function updateTextLarge(
  // This is really messy I'm sorry. I was trying to make this quickly.
  // I'll clean it up in the future.
  card: JetLagCard,
  textObjects: {
    upper?: fabric.Textbox;
    body?: fabric.Textbox;
    lower?: fabric.Textbox;
  },
  textGroup: fabric.Group,
  canvas: fabric.StaticCanvas
) {
  let rotation = 0;
  if (card.type === CardType.NormalCurse) {
    rotation = 2.39;
  } else if (card.type === CardType.HideAndSeekCurse) {
    rotation = 1.3;
  }

  if (textObjects.upper) {
    textObjects.upper.set(
      "text",
      card.type === CardType.NormalCurse ? "CURSED!" : card.upper.toUpperCase()
    );
    if (card.type === CardType.HideAndSeekCurse) {
      textObjects.upper.set("fill", "#202d3c");
    } else {
      textObjects.upper.set("fill", "black");
    }
  }
  if (textObjects.body) {
    textObjects.body.set("text", card.body);
    textObjects.body.top =
      (textObjects.upper?.top || 0) + (textObjects.upper?.height || 0) + 75;
  }
  if (textObjects.lower) {
    if (card.type === CardType.HideAndSeekCurse) {
      textObjects.lower.set("text", "CASTING COST:" + "\u00A0" + card.lower);
      textObjects.lower.top =
        (textObjects.body?.top || 0) + (textObjects.body?.height || 0) + 45;
      textObjects.lower.set("fontSize", 28);
      textObjects.lower.set("fill", "#202d3c");
      textObjects.lower.set("styles", {});
    } else {
      const rewardText = "REWARD: ";
      textObjects.lower.set("text", rewardText + "\u00A0" + card.lower);
      textObjects.lower.set("fontSize", 32);
      textObjects.lower.top =
        (textObjects.body?.top || 0) + (textObjects.body?.height || 0) + 45;
      textObjects.lower.set("fill", "black");
    }

    textGroup.set("angle", rotation);
  }
  canvas.renderAll();
}

function updateTextSmall(
  card: JetLagCard,
  textObjects: {
    upper?: fabric.Textbox;
    body?: fabric.Textbox;
    lower?: fabric.Textbox;
  },
  canvas: fabric.StaticCanvas
) {
  if (textObjects.upper && textObjects.body && textObjects.lower) {
    // Set upper
    textObjects.upper.set(
      "text",
      card.type === CardType.NormalCurse ? "CURSED!" : card.upper.toUpperCase()
    );
    if (card.type === CardType.HideAndSeekCurse) {
      textObjects.upper.set("fill", "#202d3c");
    } else {
      textObjects.upper.set("fill", "black");
    }

    // Set body
    textObjects.body.set("text", card.body);
    textObjects.body.top =
      (textObjects.upper?.top || 0) + (textObjects.upper?.height || 0) + 110;

    // Set lower
    if (card.type === CardType.HideAndSeekCurse) {
      textObjects.lower.set("text", "CASTING COST:" + "\u00A0" + card.lower);
      textObjects.lower.top =
        (textObjects.body?.top || 0) + (textObjects.body?.height || 0) + 66;
      textObjects.lower.set("fontSize", 41.055);
      textObjects.lower.set("fill", "#202d3c");
      textObjects.lower.set("styles", {});
    } else {
      const rewardText = "REWARD: ";
      textObjects.lower.set("text", rewardText + "\u00A0" + card.lower);
      textObjects.lower.set("fontSize", 46.92);
      textObjects.lower.top =
        (textObjects.body?.top || 0) + (textObjects.body?.height || 0) + 66;
      textObjects.lower.set("fill", "black");
    }
  }
  canvas.renderAll();
}

const LargeImage = ({
  card,
  setIsLoading,
  className,
  canvasRef,
}: CardDisplayProps) => {
  const isFontLoaded = useFontLoader("Infra", [
    { weight: 900 },
    { weight: 325 },
    { weight: 400 },
  ]);
  const currentType = useRef<CardType>(card.type);
  const largeCanvasEl = useRef<HTMLCanvasElement>(null);

  const largeTextObjects = useRef<{
    upper?: fabric.Textbox;
    body?: fabric.Textbox;
    lower?: fabric.Textbox;
  }>({});
  const largeTextGroup = useRef<fabric.Group | null>(null);

  useEffect(() => {
    const initalizeLargeCanvas = async () => {
      if (!isFontLoaded) return;
      // Fonts should be loaded to prevent a FOUC
      if (largeCanvasEl.current && !canvasRef.current) {
        canvasRef.current = new fabric.StaticCanvas(largeCanvasEl.current, {
          height: 1080,
          width: 1920,
          backgroundColor: "gray",
        });

        await buildBackground(card, canvasRef.current);
        largeTextObjects.current.upper = new fabric.Textbox("Upper", {
          left: 707,
          top: 154,
          fontSize: 50,
          fontFamily: "Infra",
          fontWeight: 900,
          width: 525,
        });
        largeTextObjects.current.body = new fabric.Textbox("Body", {
          left: 707,
          top: 154 + 50 + 10,
          fontSize: 28,
          fontFamily: "Infra",
          fontWeight: 325,
          width: 525,
        });
        largeTextObjects.current.lower = new fabric.Textbox("Lower", {
          left: 707,
          top: 154 + 50 + 75 + 28 + 10,
          fontSize: 32,
          fontFamily: "Infra",
          fontWeight: 900,
          width: 525,
        });

        largeTextGroup.current = new fabric.Group([
          largeTextObjects.current.upper,
          largeTextObjects.current.body,
          largeTextObjects.current.lower,
        ]);

        currentType.current = card.type;
        updateTextLarge(
          card,
          largeTextObjects.current,
          largeTextGroup.current ?? new fabric.Group(),
          canvasRef.current
        );

        Object.values(largeTextObjects.current).forEach((obj) => {
          canvasRef.current?.add(obj);
        });
      }
    };

    setIsLoading(true);
    initalizeLargeCanvas().then(() => {
      setIsLoading(false);
    });

    return () => {
      canvasRef.current?.dispose();
    };
  }, [isFontLoaded]);

  useEffect(() => {
    const buildCard = async () => {
      if (canvasRef.current != null) {
        if (card.type !== currentType.current) {
          await buildBackground(card, canvasRef.current);
          currentType.current = card.type;
        }
        updateTextLarge(
          card,
          largeTextObjects.current,
          largeTextGroup.current ?? new fabric.Group(),
          canvasRef.current
        );
        canvasRef.current.renderAll();
      }
    };
    buildCard();
  }, [card]);

  return (
    <>
      <canvas ref={largeCanvasEl} className={className} />
    </>
  );
};

const SmallCard = ({ card, setIsLoading, canvasRef }: CardDisplayProps) => {
  const isFontLoaded = useFontLoader("Infra", [
    { weight: 900 },
    { weight: 325 },
    { weight: 400 },
  ]);
  const currentType = useRef<CardType>(card.type);
  const smallCanvasEl = useRef<HTMLCanvasElement>(null);

  const smallTextObjects = useRef<{
    upper?: fabric.Textbox;
    body?: fabric.Textbox;
    lower?: fabric.Textbox;
  }>({});

  useEffect(() => {
    const initalizeSmallCanvas = async () => {
      if (!isFontLoaded) return;

      const padding = 116;
      const textWidth = 1000 - padding * 2;

      if (smallCanvasEl.current && !canvasRef.current) {
        canvasRef.current = new fabric.StaticCanvas(smallCanvasEl.current, {
          height: 1400,
          width: 1000,
          backgroundColor: "white",
        });

        smallTextObjects.current.upper = new fabric.Textbox("Upper", {
          left: padding,
          top: 90,
          fontSize: 73.31,
          fontFamily: "Infra",
          fontWeight: 900,
          width: textWidth,
        });
        smallTextObjects.current.body = new fabric.Textbox("Body", {
          left: padding,
          top: 80 + 50 + 10,
          fontSize: 41.06,
          fontFamily: "Infra",
          fontWeight: 325,
          width: textWidth,
        });
        smallTextObjects.current.lower = new fabric.Textbox("Lower", {
          left: padding,
          top: 80 + 50 + 10 + 28 + 10,
          fontSize: 46.92,
          fontFamily: "Infra",
          fontWeight: 900,
          width: textWidth,
        });

        updateTextSmall(card, smallTextObjects.current, canvasRef.current);
        currentType.current = card.type;
        Object.values(smallTextObjects.current).forEach((obj) => {
          canvasRef.current?.add(obj);
        });
      }
    };

    setIsLoading(true);
    initalizeSmallCanvas().then(() => {
      setIsLoading(false);
    });

    return () => {
      canvasRef.current?.dispose();
    };
  }, [isFontLoaded]);

  useEffect(() => {
    const buildCard = async () => {
      if (canvasRef.current != null) {
        updateTextSmall(card, smallTextObjects.current, canvasRef.current);
        canvasRef.current.renderAll();
      }
    };
    buildCard();
  }, [card]);

  return (
    <>
      <canvas ref={smallCanvasEl} style={{ display: "none" }} />
    </>
  );
};

const CardEditor = (props: CardEditorProps) => {
  return (
    <div className="d-flex flex-column w-100">
      <h3>Card Details</h3>
      <label htmlFor="cardTypeSelect" className="form-label">
        Card Type
      </label>
      <select
        value={props.card.type}
        onChange={(e) => {
          props.onEdit({
            ...props.card,
            type: parseInt(e.target.value),
          });
        }}
        id="cardTypeSelect"
        className="form-select"
        disabled={props.disabled}
      >
        <option value={CardType.NormalChallenge}>Normal Challenge</option>
        <option value={CardType.NormalCurse}>Normal Curse</option>
        <option value={CardType.HideAndSeekCurse}>Hide and Seek Curse</option>
      </select>
      <label htmlFor="upper" className="form-label mt-3">
        Card Title
      </label>
      <textarea
        id="upper"
        className="form-control"
        value={props.card.upper}
        onChange={(e) => {
          props.onEdit({
            ...props.card,
            upper: e.target.value,
          });
        }}
        rows={1}
        disabled={props.disabled}
      />
      <label htmlFor="body" className="form-label mt-3">
        Card Body
      </label>
      <textarea
        id="body"
        className="form-control"
        value={props.card.body}
        onChange={(e) => {
          props.onEdit({
            ...props.card,
            body: e.target.value,
          });
        }}
        rows={3}
        disabled={props.disabled}
      />
      <label htmlFor="lower" className="form-label mt-3">
        Card Reward / Cost
      </label>
      <textarea
        id="lower"
        className="form-control"
        value={props.card.lower}
        onChange={(e) => {
          props.onEdit({
            ...props.card,
            lower: e.target.value,
          });
        }}
        rows={1}
        disabled={props.disabled}
      />
      <div className="d-flex gap-2 mt-3 flex-md-row flex-column">
        <button
          type="button"
          className="btn btn-primary w-100"
          onClick={() => {
            props.onDownload("Image");
          }}
          disabled={props.disabled}
        >
          Save Image
        </button>
        <button
          type="button"
          className="btn btn-primary w-100 "
          onClick={() => {
            props.onDownload("Card");
          }}
          disabled={props.disabled}
        >
          Save Card
        </button>
      </div>
    </div>
  );
};

function App() {
  const [card, editCard] = useState<JetLagCard>({
    type: CardType.NormalChallenge,
    upper: "Challenge",
    lower: "1,000",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  });

  const [isLargeLoading, setIsLargeLoading] = useState<boolean>(false);
  const [isSmallLoading, setIsSmallLoading] = useState<boolean>(false);

  const largeCanvasRef = useRef<fabric.StaticCanvas | null>(null);
  const smallCanvasRef = useRef<fabric.StaticCanvas | null>(null);

  const handleEdit = (edited: JetLagCard) => {
    editCard({
      ...card,
      ...edited,
    });
  };

  const getDisplay = () => {
    return (
      <LargeImage
        card={card}
        setIsLoading={setIsLargeLoading}
        className="mb-sm-3 canvas-display"
        canvasRef={largeCanvasRef}
      />
    );
  };

  const handleDownload = (type: "Image" | "Card") => {
    const canvas =
      type === "Image" ? largeCanvasRef.current : smallCanvasRef.current;

    if (canvas) {
      const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: 1,
        width: type === "Image" ? 1920 : 1000,
        height: type === "Image" ? 1080 : 1400,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = type === "Image" ? "card-image.png" : "card-small.png";
      a.click();
      a.remove();
    }
  };

  return (
    <>
      <header>
        <nav className="navbar">
          <div className="container-lg">
            <div className="d-flex gap-1 w-100 align-items-center flex-column justify-content-center">
              <JetLagBadge height={48} />
              <h3 style={{ marginBottom: 0 }}>
                <span className="pill w-100 h-100"> The Card Generator</span>
              </h3>
            </div>
          </div>
        </nav>
      </header>

      <SmallCard
        card={card}
        setIsLoading={setIsSmallLoading}
        className=""
        canvasRef={smallCanvasRef}
      />
      <div
        style={{ flex: 1 }}
        className="container-lg d-flex justify-content-center align-items-center"
      >
        <div className="row" style={{ flex: 1 }}>
          <div className="col-lg-8 col-md-7 col-sm-12 d-flex justify-content-center align-items-center">
            {getDisplay()}
          </div>
          <div className="col-lg-4 col-md-5 col-sm-12 mb-3 mb-md-0 mt-3 mt-md-0">
            <CardEditor
              card={card}
              onEdit={(card) => {
                handleEdit(card);
              }}
              onDownload={(type) => {
                handleDownload(type);
              }}
              disabled={isLargeLoading || isSmallLoading}
            />
          </div>
        </div>
      </div>
      <footer>
        <div className="container-lg d-flex justify-content-center align-items-center flex-column">
          <p className="text-center small mb-0">
            This tool is not affiliated with or endorsed by JetLag. All
            copyrights and trademarks are reserved by their respective owners.
          </p>
          <p className="text-center small">
            Made with ♥ by{" "}
            <a
              href="https://github.com/jaxcksn"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jaxcksn
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
