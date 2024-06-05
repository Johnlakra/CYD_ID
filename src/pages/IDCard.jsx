// IDCard.js
import React, { useRef } from "react";
import { ReactToPrint } from "react-to-print";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";

const IDCard = ({ data }) => {
  const componentRef = useRef();
  console.log(data);

  return (
    <div
      ref={componentRef}
      className="card-container"
      style={{
        position: "relative",
        width: "56mm",
        height: "88mm",
        border: "1px solid #ccc",
        margin: "20px auto",
      }}
    >
      <div style={{ padding: "10px", fontSize: "12px" }}>
        <img
          src={data.photo}
          alt="User Pic"
          style={{
            width: "100%",
            height: "60%",
            objectFit: "cover",
            borderRadius: "5px",
          }}
        />
        <div style={{ marginTop: "10px" }}>
          <strong>Name:</strong> {data.name}
        </div>
        <div>
          <strong>Father:</strong> {data.father_name}
        </div>
        <div>
          <strong>Mother:</strong> {data.mother_name}
        </div>
        <div>
          <strong>DOB:</strong> {data.date_of_birth}
        </div>
        <div>
          <strong>Baptism:</strong> {data.date_of_baptism}
        </div>
        <div>
          <strong>Address:</strong> {data.postal_address}
        </div>
        <div>
          <strong>Phone:</strong> {data.phone}
        </div>
      </div>
      <ReactToPrint
        trigger={() => (
          <button
            style={{
              marginTop: "10px",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            <PrintOutlinedIcon /> Print
          </button>
        )}
        content={() => componentRef.current}
      />
    </div>
  );
};

export default IDCard;
