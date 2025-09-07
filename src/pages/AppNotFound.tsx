import React from "react";
import { Link } from "react-router-dom";
import Page from "@/components/Page";
import { ArrowLeft } from "lucide-react";

export default function AppNotFound(){
  return (
    <Page title="Seite nicht gefunden" actions={
      <Link to="/" className="btn"><ArrowLeft size={16}/>Zur Übersicht</Link>
    }>
      <div className="empty">
        <div className="title">404 – Not Found</div>
        <p className="hint">Diese Seite existiert nicht. Prüfe die URL oder gehe zurück zum Dashboard.</p>
        <Link to="/" className="btn mt-4"><ArrowLeft size={16}/>Zur Startseite</Link>
      </div>
    </Page>
  );
}
