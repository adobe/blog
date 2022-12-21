/*
 * lighthouse performance instrumentation helper
 * (needs a refactor)
 */

function stamp(message, time = new Date() - performance.timing.navigationStart, type = '') {
  // eslint-disable-next-line no-console
  const colors = {
    general: '#888',
    cls: '#c50',
    lcp: 'green',
    tbt: 'red',
    paint: '#b73',
    franklin: '#586AE8',
  };
  const color = colors[type] || '#888';
  // eslint-disable-next-line no-console
  console.log(
    `%c${Math.round(time).toString().padStart(5, ' ')}%c %c${type}%c ${message}`,
    'background-color: #444; padding: 3px; border-radius: 3px;',
    '',
    `background-color: ${color}; padding: 3px 5px; border-radius: 3px;`,
    '',
  );
}

function registerPerformanceLogger() {
  try {
    const polcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        stamp(JSON.stringify(entry), entry.startTime, 'lcp');
        // eslint-disable-next-line no-console
        console.log(entry.element);
      });
    });
    polcp.observe({ type: 'largest-contentful-paint', buffered: true });

    const pols = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const to = entry.sources[0].currentRect;
        const from = entry.sources[0].previousRect;
        stamp(`${Math.round(entry.value * 100000) / 100000}
        from: ${from.top} ${from.right} ${from.bottom} ${from.left}
        to:   ${to.top} ${to.right} ${to.bottom} ${to.left}`, entry.startTime, 'cls');
        // eslint-disable-next-line no-console
        console.log(entry.sources[0].node);
      });
    });
    pols.observe({ type: 'layout-shift', buffered: true });

    const polt = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log the entry and all associated details.
        stamp(JSON.stringify(entry), entry.startTime, 'tbt');
      });
    });

    // Start listening for `longtask` entries to be dispatched.
    polt.observe({ type: 'longtask', buffered: true });

    const popaint = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log the entry and all associated details.
        stamp(JSON.stringify(entry), entry.startTime, 'paint');
      });
    });
    // Start listening for `longtask` entries to be dispatched.
    popaint.observe({ type: 'paint', buffered: true });

    const pores = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        stamp(`${entry.name} loaded`, Math.round(entry.startTime + entry.duration));
      });
    });
    pores.observe({ type: 'resource', buffered: true });

    document.body.addEventListener('section-display', (e) => {
      stamp(`section displayed (${e.detail.sectionIndex + 1}/${e.detail.numSections})`, new Date() - performance.timing.navigationStart, 'franklin');
      // eslint-disable-next-line no-console
      console.log(e.detail.section);
    });

    document.body.addEventListener('block-loaded', (e) => {
      stamp(`block loaded (${e.detail.blockName})`, new Date() - performance.timing.navigationStart, 'franklin');
      // eslint-disable-next-line no-console
      console.log(e.detail.block);
    });
  } catch (e) {
    // no output
  }
}

export default function performanceLogger() {
  stamp('helix performance logging started');
  registerPerformanceLogger();
}
