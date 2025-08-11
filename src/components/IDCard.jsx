import { useCallback, useRef } from "react";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ParishIdPic from "../assets/images/Parish.jpg";
import DeaneryIdPic from "../assets/images/Deanery.jpg";
import DexcoIdPic from "../assets/images/Dexco.jpg";
import dayjs from "dayjs";
import { toPng } from "html-to-image";
import { capitalizeName } from "../utils/text-format";


const IDCard = ({ data }) => {
  const ref = useRef(null);
  console.log(data,'data');
  

  let IdPic;
  switch (data.level) {
    case "parish":
      IdPic = ParishIdPic;
      break;
    case "deanery":
      IdPic = DeaneryIdPic;
      break;
    case "dexco":
      IdPic = DexcoIdPic;
      break;
    default:
      IdPic = ParishIdPic; // Default to parish image
      break;
  }

  const handleDownloadImage = useCallback(() => {
    if (ref.current === null) {
      return;
    }

    toPng(ref.current, { cacheBust: true, scale: 3 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${data.name}-${data.parish}-${data.phone}`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to convert to image:", err);
      });
  }, [data.name, data.parish, data.phone]);


  return (
    <div>
      <div
        ref={ref}
        className="card-container"
        style={{
          position: "relative",
          width: "146.3mm",
          height: "221.8mm",
          backgroundImage: `url(${IdPic})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
        }}
      >
        <img
          src={data.photo}
          alt="User Pic"
          style={{
            position: "absolute",
            top: "42.5mm",
            left: "50%",
            transform: "translateX(-50%)",
            width: "58mm",
            height: "67mm",
            border: "1px solid #8D8D8D",
            objectFit: "cover",
            borderRadius: "14px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "121mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "16px",
            color: "#C01E2C",
            fontFamily: "Roboto",
            textAlign: "center",
            width: "2190px",
          }}
        >
          {data.designation}
        </div>
        <div
          style={{
            position: "absolute",
            top: "111.2mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "31.5px",
            color: "#C01E2C",
            fontFamily: "Vidaloka",
            textAlign: "center",
            width: "2190px",
          }}
        >
          {capitalizeName(data.name)}
        </div>
        <div
          style={{
            position: "absolute",
            top: "128mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.deanery}
        </div>
        <div
          style={{
            position: "absolute",
            top: "136.1mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.parish}
        </div>
        <div
          style={{
            position: "absolute",
            top: "144.12mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {dayjs(data.date_of_baptism).format("DD-MM-YYYY")}
        </div>
        <div
          style={{
            position: "absolute",
            top: "152.4mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {dayjs(data.date_of_birth).format("DD-MM-YYYY")}
        </div>
        <div
          style={{
            position: "absolute",
            top: "160.68mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.phone}
        </div>
        <div
          style={{
            position: "absolute",
            top: "168.96mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.father_name}
        </div>
        <div
          style={{
            position: "absolute",
            top: "177.24mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
            width: "35mm",
            whiteSpace: "pre-wrap",
          }}
        >
          :
        </div>
        <div
          style={{
            position: "absolute",
            top: "177.5mm",
            left: "56.9mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
            width: "82mm",
            whiteSpace: "pre-wrap",
            lineHeight: "96.5%"
          }}
        >
          {data.postal_address}
        </div>
        <div
          style={{
            position: "absolute",
            top: "213mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "19px",
            // fontWeight:'bold',
            fontFamily: "roboto",
            color: "#fff",
            textAlign: "center",
            width: "100mm",
          }}
        >
          |
        </div>  
        <div
          style={{
            position: "absolute",
            top: "213mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "19px",
            // fontWeight:'bold',
            fontFamily: "roboto",
            color: "#fff",
            textAlign: "left",
            width: "100mm",
          }}
        >
          Issued: {dayjs(data.issue_date).format("DD-MM-YYYY")}
        </div>      
        <div
          style={{
            position: "absolute",
            top: "213mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "19px",
            // fontWeight:'bold',
            fontFamily: "roboto",
            color: "#fff",
            textAlign: "right",
            width: "100mm",
          }}
        >
          Valid for two years
        </div>      
      </div>
      
      {/* <button
        onClick={handlePrint}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          cursor: "pointer",
        }}
      >
        <PrintOutlinedIcon /> Print
      </button> */}
      <button
        onClick={handleDownloadImage}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          cursor: "pointer",
        }}
      >
        <PrintOutlinedIcon /> Download as PNG
      </button>
    </div>
  );
};

export default IDCard;
