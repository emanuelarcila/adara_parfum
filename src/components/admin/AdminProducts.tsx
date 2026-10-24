import React, { useState } from 'react';
import { Product, OlfactiveFamily } from '../../types';
import { formatCOP, getProductImageUrl } from '../../data/mockData';
import { Plus, Search, Edit2, Pause, Play, Trash2, X } from 'lucide-react';

/**
 * Propiedades para el módulo de administración de catálogo y precios.
 */
interface AdminProductsProps {
  /** Lista de productos disponibles en el catálogo. */
  products: Product[];
  /** Callback para guardar una fragancia creada o actualizada. */
  onSaveProduct: (product: Product) => void;
  /** Callback para alternar el estado comercial del producto ('active' <-> 'paused'). */
  onToggleStatus: (id: string) => void;
  /** Callback para eliminar permanentemente un producto del catálogo. */
  onDeleteProduct: (id: string) => void;
}

/**
 * Módulo de gestión del catálogo de fragancias y precios para administradores.
 *
 * @remarks
 * Permite buscar productos en tiempo real, filtrar por familia olfativa,
 * pausar o activar fragancias, crear nuevos registros y editar la ficha técnica (notas, precios, existencias).
 *
 * @param props - Propiedades del componente {@link AdminProductsProps}.
 * @returns Elemento JSX con la tabla de productos y modal de edición.
 */
export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  onSaveProduct,
  onToggleStatus,
  onDeleteProduct
}) => {
  const [search, setSearch] = useState('');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formVolume, setFormVolume] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formThreshold, setFormThreshold] = useState<number>(3);
  const [formFamily, setFormFamily] = useState<OlfactiveFamily>('Oriental & Ámbar');
  const [formDesc, setFormDesc] = useState('');
  const [formTop, setFormTop] = useState('');
  const [formHeart, setFormHeart] = useState('');
  const [formBase, setFormBase] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIntensity, setFormIntensity] = useState<number | ''>('');

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrand('');
    setFormVolume('');
    setFormSubtitle('');
    setFormPrice('');
    setFormStock(0);
    setFormThreshold(3);
    setFormFamily('Oriental & Ámbar');
    setFormDesc('');
    setFormTop('');
    setFormHeart('');
    setFormBase('');
    setFormImage('');
    setFormIntensity('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name || '');
    setFormBrand(p.brand || '');
    setFormVolume(p.volume || '');
    setFormSubtitle(p.subtitle || '');
    setFormPrice(p.priceCOP !== null && p.priceCOP > 0 ? p.priceCOP : '');
    setFormStock(p.stock ?? 0);
    setFormThreshold(p.threshold ?? 3);
    setFormFamily(p.family || 'Oriental & Ámbar');
    setFormDesc(p.description || '');
    setFormTop(p.notesTop ? p.notesTop.join(', ') : '');
    setFormHeart(p.notesHeart ? p.notesHeart.join(', ') : '');
    setFormBase(p.notesBase ? p.notesBase.join(', ') : '');
    setFormImage(p.image || '');
    setFormIntensity(p.intensity ?? '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = formPrice !== '' && Number(formPrice) > 0 ? Number(formPrice) : null;
    const parsedStock = Math.max(0, Number(formStock) || 0);

    const resolvedImage = formImage.trim()
      ? formImage.trim()
      : (editingProduct?.image || getProductImageUrl({ id: editingProduct?.id, name: formName, family: formFamily }));

    // Preservación estricta de variantes y acordes preexistentes al editar datos generales del producto
    const updated: Product = {
      id: editingProduct ? editingProduct.id : `adara-${Date.now()}`,
      name: formName.trim(),
      subtitle: formSubtitle.trim() ? formSubtitle.trim() : null,
      brand: formBrand.trim() || (editingProduct ? editingProduct.brand : 'Sin marca asignada'),
      volume: formVolume.trim() ? formVolume.trim() : null,
      priceCOP: parsedPrice,
      stock: parsedStock,
      threshold: Number(formThreshold) || 3,
      family: formFamily,
      status: editingProduct ? editingProduct.status : 'active',
      description: formDesc.trim() ? formDesc.trim() : null,
      notesTop: formTop ? formTop.split(',').map((s) => s.trim()).filter(Boolean) : [],
      notesHeart: formHeart ? formHeart.split(',').map((s) => s.trim()).filter(Boolean) : [],
      notesBase: formBase ? formBase.split(',').map((s) => s.trim()).filter(Boolean) : [],
      image: resolvedImage,
      featured: editingProduct ? editingProduct.featured : false,
      intensity: formIntensity !== '' && Number(formIntensity) > 0 ? Number(formIntensity) : null,
      ...(editingProduct?.accords ? { accords: editingProduct.accords } : {}),
      ...(editingProduct?.variants ? { variants: editingProduct.variants } : {})
    };

    onSaveProduct(updated);
    setIsModalOpen(false);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.family.toLowerCase().includes(search.toLowerCase());
    const matchFamily = filterFamily === 'all' || p.family === filterFamily;
    return matchSearch && matchFamily;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--color-ivory)' }}>
            Catálogo de Fragancias
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Gestión de fórmulas, precios en COP, presentaciones e inventario
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '4px',
            backgroundColor: 'var(--color-gold)',
            color: 'var(--color-obsidian)',
            border: 'none',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
        >
          <Plus size={16} />
          <span>Nueva Fragancia</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="liquid-glass"
        style={{
          padding: '16px 20px',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(11, 11, 10, 0.7)',
            padding: '8px 14px',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            minWidth: '280px'
          }}
        >
          <Search size={14} color="var(--color-gold)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o familia..."
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-ivory)',
              fontSize: '12px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Familia:
          </span>
          <select
            value={filterFamily}
            onChange={(e) => setFilterFamily(e.target.value)}
            style={{
              backgroundColor: 'rgba(11, 11, 10, 0.8)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              padding: '6px 12px',
              color: 'var(--color-ivory)',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            <option value="all">Todas las familias</option>
            <option value="Oriental & Ámbar">Oriental & Ámbar</option>
            <option value="Cuero & Humo">Cuero & Humo</option>
            <option value="Floral Oscuro">Floral Oscuro</option>
            <option value="Amaderada">Amaderada</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div
        className="liquid-glass-card"
        style={{ borderRadius: '6px', overflow: 'hidden' }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)', textAlign: 'left' }}>
              <th style={{ padding: '14px 20px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Producto</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Familia</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Precio COP</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Stock</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Estado</th>
              <th style={{ padding: '14px 20px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const isLowStock = product.stock <= (product.threshold ?? 3);
              return (
                <tr key={product.id} style={{ borderBottom: '1px solid rgba(56, 48, 36, 0.35)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {(() => {
                        const displayImg = getProductImageUrl(product);
                        return displayImg ? (
                          <img
                            src={displayImg}
                            alt={product.name}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            style={{
                              width: '44px',
                              height: '52px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              backgroundColor: '#111'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '44px',
                              height: '52px',
                              borderRadius: '4px',
                              backgroundColor: '#161614',
                              border: '1px solid rgba(198, 161, 91, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <span style={{ fontSize: '9px', color: 'var(--color-gold)', fontWeight: 700 }}>ADR</span>
                          </div>
                        );
                      })()}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>{product.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          {product.volume || (product.brand ? `Casa ${product.brand}` : 'Volumen pendiente')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--color-text-secondary)' }}>
                    {product.family}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 600, color: 'var(--color-gold)' }}>
                    {product.priceCOP && product.priceCOP > 0 ? (
                      formatCOP(product.priceCOP)
                    ) : (
                      <span style={{ color: 'var(--color-gold-light)', fontStyle: 'italic', fontSize: '11px' }}>
                        Bajo consulta
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: isLowStock ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: isLowStock ? 'var(--color-warning)' : 'var(--color-ivory)'
                      }}
                    >
                      {product.stock} uds {isLowStock && '· Bajo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        backgroundColor:
                          product.status === 'active'
                            ? 'rgba(74, 222, 128, 0.12)'
                            : product.status === 'paused'
                            ? 'rgba(251, 191, 36, 0.12)'
                            : 'rgba(248, 113, 113, 0.12)',
                        color:
                          product.status === 'active'
                            ? 'var(--color-success)'
                            : product.status === 'paused'
                            ? 'var(--color-warning)'
                            : 'var(--color-danger)'
                      }}
                    >
                      {product.status === 'active' ? 'Activo' : product.status === 'paused' ? 'Pausado' : 'Agotado'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: 'var(--color-ivory)',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px'
                        }}
                        title="Editar fragancia"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(product.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: product.status === 'active' ? 'var(--color-warning)' : 'var(--color-success)',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px'
                        }}
                        title={product.status === 'active' ? 'Pausar venta' : 'Activar venta'}
                      >
                        {product.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product.id)}
                        style={{
                          background: 'rgba(248, 113, 113, 0.08)',
                          border: '1px solid rgba(248, 113, 113, 0.25)',
                          borderRadius: '4px',
                          color: 'var(--color-danger)',
                          padding: '6px 8px'
                        }}
                        title="Eliminar del catálogo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'rgba(11, 11, 10, 0.85)',
            backdropFilter: 'blur(12px)'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="liquid-glass animate-rise"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '8px',
              padding: '36px',
              backgroundColor: 'rgba(23, 23, 20, 0.98)',
              border: '1px solid var(--color-border-gold)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--color-ivory)' }}>
                {editingProduct ? 'Editar Fragancia' : 'Nueva Fragancia ADARA'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Row 1: Name & Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Nombre del Perfume *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Ej. 9 PM Pour Femme"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Marca / Casa Perfumista
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Ej. Afnan, Armaf, ADARA..."
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Row 2: Presentation & Subtitle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Presentación / Volumen (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    placeholder="Ej. 100 ml, 80 ml, 50 ml"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Subtítulo / Edición (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="Ej. Eau de Parfum · Edición Exclusiva"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Row 3: Commercial & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Precio COP (0 = Bajo consulta)
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0 o vacío"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Stock Físico Inicial
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    min={0}
                    required
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Umbral Alerta
                  </label>
                  <input
                    type="number"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(Number(e.target.value))}
                    min={1}
                    required
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Row 4: Family & Intensity */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Familia Olfativa
                  </label>
                  <select
                    value={formFamily}
                    onChange={(e) => setFormFamily(e.target.value as OlfactiveFamily)}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="Oriental & Ámbar">Oriental & Ámbar</option>
                    <option value="Cuero & Humo">Cuero & Humo</option>
                    <option value="Floral Oscuro">Floral Oscuro</option>
                    <option value="Amaderada">Amaderada</option>
                    <option value="Cítrico Noble">Cítrico Noble</option>
                    <option value="Ámbar Amaderada">Ámbar Amaderada</option>
                    <option value="Ámbar Vainilla">Ámbar Vainilla</option>
                    <option value="Amaderada Aromática">Amaderada Aromática</option>
                    <option value="Ámbar Especiada">Ámbar Especiada</option>
                    <option value="Floral Frutal">Floral Frutal</option>
                    <option value="Chipre Frutal">Chipre Frutal</option>
                    <option value="Ámbar Floral">Ámbar Floral</option>
                    <option value="Aromática Frutal">Aromática Frutal</option>
                    <option value="Aromática Acuática">Aromática Acuática</option>
                    <option value="Amaderada Especiada">Amaderada Especiada</option>
                    <option value="Oriental Floral">Oriental Floral</option>
                    <option value="Floral Acuática">Floral Acuática</option>
                    <option value="Cítrica Aromática">Cítrica Aromática</option>
                    <option value="Aromática Fougère">Aromática Fougère</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Intensidad (1-5)
                  </label>
                  <select
                    value={formIntensity === '' ? '' : formIntensity}
                    onChange={(e) => setFormIntensity(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="">Sin calificar</option>
                    <option value="1">1 / 5 - Sutil</option>
                    <option value="2">2 / 5 - Moderada</option>
                    <option value="3">3 / 5 - Marcada</option>
                    <option value="4">4 / 5 - Intensa</option>
                    <option value="5">5 / 5 - Muy Intensa</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Descripción Editorial
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Notas Salida
                  </label>
                  <input
                    type="text"
                    value={formTop}
                    onChange={(e) => setFormTop(e.target.value)}
                    placeholder="Separa con comas"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Notas Corazón
                  </label>
                  <input
                    type="text"
                    value={formHeart}
                    onChange={(e) => setFormHeart(e.target.value)}
                    placeholder="Separa con comas"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Notas Fondo
                  </label>
                  <input
                    type="text"
                    value={formBase}
                    onChange={(e) => setFormBase(e.target.value)}
                    placeholder="Separa con comas"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Row 5: Fragrance Image & Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  URL o Ruta de Imagen del Frasco (Opcional)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Ej. /images/oud_royal.jpg o URL web"
                    style={{ flex: 1, padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  />
                  {formImage ? (
                    <img
                      src={formImage}
                      alt="Previsualización"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      style={{ width: '38px', height: '44px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-gold)' }}
                    />
                  ) : null}
                </div>

                {/* Quick Presets for official bottles */}
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Oficiales:
                  </span>
                  {[
                    { label: 'Oud Royal', path: '/images/oud_royal.jpg' },
                    { label: 'Rose Noire', path: '/images/rose_noire.jpg' },
                    { label: 'Ambre Impérial', path: '/images/ambre_imperial.jpg' },
                    { label: 'Cuir Sauvage', path: '/images/cuir_sauvage.jpg' },
                    { label: 'Santal Blanc', path: '/images/santal_blanc.jpg' },
                    { label: 'Hero Monolito', path: '/images/hero_adara.jpg' }
                  ].map((preset) => (
                    <button
                      key={preset.path}
                      type="button"
                      onClick={() => setFormImage(preset.path)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '10px',
                        borderRadius: '3px',
                        backgroundColor: formImage === preset.path ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.05)',
                        color: formImage === preset.path ? '#0b0b0a' : 'var(--color-ivory)',
                        border: '1px solid rgba(198, 161, 91, 0.25)',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '12px 20px', borderRadius: '4px', backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-ivory)', fontSize: '11px', textTransform: 'uppercase' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '12px 24px', borderRadius: '4px', backgroundColor: 'var(--color-gold)', border: 'none', color: 'var(--color-obsidian)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}
                >
                  Guardar Fragancia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
