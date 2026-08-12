'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeFromCompare, clearCompare } from '../../store/compareSlice';
import { addToCart } from '../../store/cartSlice';
import { Trash2, ShoppingCart, Award, Sparkles, AlertCircle } from 'lucide-react';
import styles from './compare.module.css';
import { useToast } from '../../context/ToastContext';

export default function CompareMatrix() {
  const dispatch = useDispatch();
  const compareItems = useSelector((state: RootState) => state.compare.items);
  const [highlights, setHighlights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (compareItems.length > 0) {
      const getHighlights = async () => {
        setLoading(true);
        try {
          const ids = compareItems.map((i) => i.id);
          const res = await fetch('http://localhost:5000/api/products/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: ids })
          });
          if (res.ok) {
            const data = await res.json();
            setHighlights(data.highlights);
          } else {
            calculateClientHighlights();
          }
        } catch (_) {
          calculateClientHighlights();
        } finally {
          setLoading(false);
        }
      };
      getHighlights();
    } else {
      setHighlights(null);
    }
  }, [compareItems]);

  // Client fallback comparison highlights
  const calculateClientHighlights = () => {
    if (compareItems.length === 0) return;
    
    let bestBattery = compareItems[0].id;
    let maxBat = 0;

    let bestProcessor = compareItems[0].id;
    let maxCpuScore = 0;

    let bestDisplay = compareItems[0].id;
    let maxDispScore = 0;

    let bestValue = compareItems[0].id;
    let bestRatio = 0;

    compareItems.forEach((i) => {
      // Battery comparison
      const bat = parseInt(i.specs.battery?.match(/\d+/)?.[0] || '0');
      if (bat > maxBat) {
        maxBat = bat;
        bestBattery = i.id;
      }
      
      // Processor comparison
      const cpu = (i.specs.processor || '').toLowerCase();
      let cpuScore = 50;
      if (cpu.includes('9300') || cpu.includes('8 gen 3') || cpu.includes('8 gen 2')) cpuScore = 100;
      else if (cpu.includes('8200') || cpu.includes('8+ gen 1') || cpu.includes('8s gen 3')) cpuScore = 90;
      else if (cpu.includes('7050') || cpu.includes('7 gen 3') || cpu.includes('7200') || cpu.includes('7300')) cpuScore = 80;
      else if (cpu.includes('dimensity 6100') || cpu.includes('dimensity 6300') || cpu.includes('t616') || cpu.includes('octa')) cpuScore = 65;
      
      if (cpuScore > maxCpuScore) {
        maxCpuScore = cpuScore;
        bestProcessor = i.id;
      }

      // Display comparison
      const disp = (i.specs.display || '').toLowerCase();
      const hz = parseInt(i.specs.refreshRate?.match(/\d+/)?.[0] || '60');
      let dispScore = hz;
      if (disp.includes('amoled') || disp.includes('oled')) dispScore += 30;
      
      if (dispScore > maxDispScore) {
        maxDispScore = dispScore;
        bestDisplay = i.id;
      }
      
      // Value ratio
      const valRatio = cpuScore / (i.price / 10000);
      if (valRatio > bestRatio) {
        bestRatio = valRatio;
        bestValue = i.id;
      }
    });

    setHighlights({
      bestBattery,
      bestDisplay,
      bestProcessor,
      bestValue
    });
  };

  const handleRemove = (id: string) => {
    dispatch(removeFromCompare(id));
  };

  const handleClear = () => {
    dispatch(clearCompare());
  };

  const handleBuy = (prod: any) => {
    dispatch(
      addToCart({
        productId: prod.id,
        name: prod.name,
        image: prod.image,
        brand: prod.brand,
        ram: prod.specs.processor?.includes('16GB') ? '16GB' : '8GB',
        storage: '128GB',
        color: 'Default',
        price: prod.price,
        quantity: 1
      })
    );
    showToast(`${prod.name} added to cart!`, 'success');
  };

  if (compareItems.length === 0) {
    return (
      <div className={`${styles.emptyCompare} container`}>
        <AlertCircle size={48} className={styles.emptyIcon} />
        <h2>Compare Matrix is Empty</h2>
        <p>You have not added any smartphones to compare. Go to our catalog to select up to 4 models.</p>
        <Link href="/products" className="btn btnPrimary">Browse Smartphones</Link>
      </div>
    );
  }

  return (
    <div className={`${styles.comparePage} container`}>
      <div className={styles.headerRow}>
        <div>
          <h1>Smart Compare</h1>
          <p>Side-by-side technical evaluation of selected models</p>
        </div>
        <button onClick={handleClear} className={styles.clearAllBtn}>
          Clear Comparison
        </button>
      </div>

      <div className={styles.compareGrid} style={{ gridTemplateColumns: `180px repeat(${compareItems.length}, 1fr)` }}>
        {/* Row Header column */}
        <div className={styles.rowHeaderCol}>
          <div className={styles.gridCellHeader}>Device Details</div>
          <div className={styles.gridCell}>Brand</div>
          <div className={styles.gridCell}>Price</div>
          <div className={styles.gridCell}>Processor</div>
          <div className={styles.gridCell}>Camera Setup</div>
          <div className={styles.gridCell}>Battery & Power</div>
          <div className={styles.gridCell}>Display Spec</div>
          <div className={styles.gridCell}>Smart Indicators</div>
          <div className={styles.gridCellActions}>Actions</div>
        </div>

        {/* Product details loop columns */}
        {compareItems.map((prod) => {
          const isBestBattery = highlights?.bestBattery === prod.id;
          const isBestValue = highlights?.bestValue === prod.id;
          const isBestProcessor = highlights?.bestProcessor === prod.id;
          const isBestDisplay = highlights?.bestDisplay === prod.id;

          return (
            <div key={prod.id} className={styles.productCol}>
              {/* Product Header */}
              <div className={styles.gridCellHeaderCard}>
                <button onClick={() => handleRemove(prod.id)} className={styles.removeBtn} title="Remove">
                  <Trash2 size={16} />
                </button>
                <img src={prod.image} alt={prod.name} />
                <h3>{prod.name}</h3>
              </div>

              <div className={styles.gridCell}><strong>{prod.brand}</strong></div>
              <div className={styles.gridCell}><span className={styles.priceText}>₹{prod.price.toLocaleString()}</span></div>
              <div className={styles.gridCell}>{prod.specs.processor}</div>
              <div className={styles.gridCell}>{prod.specs.camera}</div>
              <div className={styles.gridCell}>{prod.specs.battery}</div>
              <div className={styles.gridCell}>{prod.specs.display}</div>

              {/* Award Badges */}
              <div className={styles.gridCell}>
                <div className={styles.awardsList}>
                  {isBestBattery && (
                    <span className={`${styles.awardBadge} ${styles.batteryAward}`}>
                      <Award size={12} /> Best Battery
                    </span>
                  )}
                  {isBestProcessor && (
                    <span className={`${styles.awardBadge} ${styles.cpuAward}`}>
                      <Award size={12} /> Best Processor
                    </span>
                  )}
                  {isBestDisplay && (
                    <span className={`${styles.awardBadge} ${styles.displayAward}`}>
                      <Award size={12} /> Best Screen
                    </span>
                  )}
                  {isBestValue && (
                    <span className={`${styles.awardBadge} ${styles.valueAward}`}>
                      <Award size={12} /> Best Value
                    </span>
                  )}
                  {!isBestBattery && !isBestProcessor && !isBestDisplay && !isBestValue && (
                    <span className={styles.noAward}>Balanced Config</span>
                  )}
                </div>
              </div>

              {/* Buy Actions */}
              <div className={styles.gridCellActions}>
                <button onClick={() => handleBuy(prod)} className="btn btnPrimary">
                  <ShoppingCart size={14} /> Buy Variant
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Specification Score Charts visualization */}
      <section className={`${styles.chartsSection} glass`}>
        <div className={styles.chartsHeader}>
          <Sparkles className={styles.sparkleIcon} />
          <h2>AI Performance Index</h2>
        </div>
        <p className={styles.chartsSub}>Comparative weighted specifications index mapping benchmark indexes.</p>
        
        <div className={styles.chartBarsList}>
          {compareItems.map((prod) => {
            // Calculate a benchmark score representing processor/battery strengths
            let score = 65;
            const cpu = (prod.specs.processor || '').toLowerCase();
            if (cpu.includes('9300') || cpu.includes('8 gen 3')) score = 98;
            else if (cpu.includes('8200') || cpu.includes('8+ gen 1')) score = 88;
            else if (cpu.includes('7050')) score = 78;
            else if (cpu.includes('t616')) score = 62;

            return (
              <div key={prod.id} className={styles.chartBarRow}>
                <span className={styles.barLabel}>{prod.name}</span>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.barFill} 
                    style={{ width: `${score}%` }}
                  >
                    <span>{score} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
