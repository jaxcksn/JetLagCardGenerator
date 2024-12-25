/// <reference types="vite-plugin-svgr/client" />
import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import FontFaceObserver from "fontfaceobserver";
import JetLagBadge from "./assets/JetLagLogo.svg?react";

interface CardDisplayProps {
  card: JetLagCard;
  setImageData: (data: string) => void;
}

interface CardEditorProps {
  card: JetLagCard;
  onEdit: (card: JetLagCard) => void;
  onDownload: () => void;
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

function updateText(
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
      (textObjects.upper?.top || 0) + (textObjects.upper?.height || 0) + 45;
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

const CardDisplay = ({ card, setImageData }: CardDisplayProps) => {
  const currentType = useRef<CardType>(card.type);
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const canvas = useRef<fabric.StaticCanvas | null>(null);
  const textObjects = useRef<{
    upper?: fabric.Textbox;
    body?: fabric.Textbox;
    lower?: fabric.Textbox;
  }>({});
  const textGroup = useRef<fabric.Group | null>(null);

  useEffect(() => {
    const initalizeCanvas = async () => {
      // Fonts should be loaded to prevent a FOUC
      const infraFontObserver = new FontFaceObserver("Infra");
      await infraFontObserver.load().then(async () => {
        if (canvasEl.current && !canvas.current) {
          canvas.current = new fabric.StaticCanvas(canvasEl.current, {
            height: 1080,
            width: 1920,
            backgroundColor: "gray",
          });

          await buildBackground(card, canvas.current);
          textObjects.current.upper = new fabric.Textbox("Upper", {
            left: 707,
            top: 154,
            fontSize: 50,
            fontFamily: "Infra",
            fontWeight: 900,
            width: 525,
          });
          textObjects.current.body = new fabric.Textbox("Body", {
            left: 707,
            top: 154 + 50 + 10,
            fontSize: 28,
            fontFamily: "Infra",
            fontWeight: 325,
            width: 525,
          });
          textObjects.current.lower = new fabric.Textbox("Lower", {
            left: 707,
            top: 154 + 50 + 75 + 28 + 10,
            fontSize: 32,
            fontFamily: "Infra",
            fontWeight: 900,
            width: 525,
          });

          textGroup.current = new fabric.Group([
            textObjects.current.upper,
            textObjects.current.body,
            textObjects.current.lower,
          ]);

          currentType.current = card.type;
          updateText(
            card,
            textObjects.current,
            textGroup.current ?? new fabric.Group(),
            canvas.current
          );

          Object.values(textObjects.current).forEach((obj) => {
            canvas.current?.add(obj);
          });

          updateCanvasImage();
        }
      });
    };
    initalizeCanvas();
    return () => {
      canvas.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const buildCard = async () => {
      if (canvas.current != null) {
        if (card.type !== currentType.current) {
          await buildBackground(card, canvas.current);
          currentType.current = card.type;
        }
        updateText(
          card,
          textObjects.current,
          textGroup.current ?? new fabric.Group(),
          canvas.current
        );
        canvas.current.renderAll();
        updateCanvasImage();
      }
    };
    buildCard();
  }, [card]);

  const updateCanvasImage = () => {
    if (canvas.current) {
      const dataUrl = canvas.current.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 1,
      });
      setImageData(dataUrl);
    }
  };

  return <canvas ref={canvasEl} style={{ display: "none" }} />;
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
      />
      <div className="d-grid mt-3">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            props.onDownload();
          }}
        >
          Save Image
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

  const [imageData, setImageData] = useState<string>("");

  const handleEdit = (edited: JetLagCard) => {
    editCard({
      ...card,
      ...edited,
    });
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
      <CardDisplay
        card={card}
        setImageData={(data) => {
          setImageData(data);
        }}
      />
      <div
        style={{ flex: 1 }}
        className="container-lg d-flex justify-content-center align-items-center"
      >
        <div className="row">
          <div className="col-lg-8 col-md-7 col-sm-12 d-flex justify-content-center align-items-center">
            <img src={imageData} alt="Card" className="img-fluid mb-sm-3" />
          </div>

          <div className="col-lg-4 col-md-5 col-sm-12 mb-3 mb-md-0 mt-3 mt-md-0">
            <CardEditor
              card={card}
              onEdit={(card) => {
                handleEdit(card);
              }}
              onDownload={() => {
                const a = document.createElement("a");
                a.href = imageData;
                a.download = "card.png";
                a.click();
                a.remove();
              }}
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
