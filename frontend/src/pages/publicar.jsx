import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import PublishTextarea from "../components/common/PublishTextarea";
import ImagePreview from "../components/common/ImagePreview";
import PublishOptions from "../components/common/PublishOptions";
import PublishFooter from "../components/common/PublishFooter";

const Publicar = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Estados: Compartir momento
  const [momentText, setMomentText] = useState("");
  const [momentImage, setMomentImage] = useState(null);
  const [momentImageFile, setMomentImageFile] = useState(null);

  // Handlers
  const handleMomentImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMomentImage(URL.createObjectURL(file));
      setMomentImageFile(file);
    }
  };

  const clearMomentImage = () => {
    setMomentImage(null);
    setMomentImageFile(null);
  };

  // Publicar momento
  const publishMoment = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!momentText.trim() && !momentImageFile) {
        setError("Debes escribir algo o subir una imagen");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para publicar");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("contenido", momentText);
      formData.append("tipo", "update");

      if (momentImageFile) {
        formData.append("imagen", momentImageFile);
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al publicar");
      }

      // Limpiar formulario
      setMomentText("");
      setMomentImage(null);
      setMomentImageFile(null);
      setSuccess(true);

      setTimeout(() => {
        window.location.href = "/home";
      }, 2000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Error al publicar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIDEBAR IZQUIERDO */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              {/* ✅ SIN TABS: SOLO MOMENTO */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  Comparte un momento
                </h2>
                
              </div>

              {/* Mensajes de estado */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>✅</span>
                  <span>¡Publicado exitosamente! Redirigiendo...</span>
                </div>
              )}

              <PublishTextarea
                value={momentText}
                setValue={setMomentText}
                disabled={loading}
              />

              {momentImage && (
                <ImagePreview
                  image={momentImage}
                  clearImage={clearMomentImage}
                  disabled={loading}
                />
              )}

              <PublishOptions handleImage={handleMomentImage} disabled={loading} />

              <PublishFooter
                publish={publishMoment}
                loading={loading}
                disabled={loading || (!momentText.trim() && !momentImageFile)}
              />

              {/* Indicador de carga */}
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-gray-600 mt-2">Publicando...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Publicar;
