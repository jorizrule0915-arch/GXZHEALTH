const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

const methodData = {
  paypal: {
    label:   'PayPal',
    color:   '#003087',
    bg:      'rgba(0,48,135,.08)',
    title:   'Pay via PayPal',
    desc:    'Open PayPal → Send & Request → Scan QR Code. Point at the code below.',
    note:    'powered by PayPal',
    qrType:  'image',
    qrSrc:   'images/paypal.jpeg'
  },
  venmo: {
    label:   'Venmo',
    color:   '#008cff',
    bg:      'rgba(0,140,255,.08)',
    title:   'Pay via Venmo',
    desc:    'Open Venmo → Tap the QR icon → Switch to Scan → Point at the code below.',
    note:    'powered by Venmo',
    qrType:  'image',
    qrSrc:   'images/Venmo.png'
  },
  apple: {
    label:   'Apple Pay',
    color:   '#1c1c1e',
    bg:      'rgba(28,28,30,.08)',
    title:   'Pay via Apple Pay',
    desc:    'Open Wallet → Send → Tap QR icon → Scan the code & confirm with Face ID.',
    note:    'powered by Apple Pay',
    qrType:  'none'
  },
  zelle: {
    label:   'Zelle',
    color:   '#6d1ed4',
    bg:      'rgba(109,30,212,.08)',
    title:   'Pay via Zelle',
    desc:    'Open Zelle in your banking app → Send Money → Scan QR Code → Point below.',
    note:    'powered by Zelle',
    qrType:  'none'
  }
};

function openModal(method) {
  const d = methodData[method];
  const overlay = document.getElementById('qrModal');
  const badge   = document.getElementById('modalBadge');
  const title   = document.getElementById('modalTitle');
  const desc    = document.getElementById('modalDesc');
  const note    = document.getElementById('modalMethodNote');
  const qrImage = document.getElementById('qrImage');
  const qrPDF   = document.getElementById('qrPDF');
  const qrPlaceholder = document.getElementById('qrPlaceholder');

  badge.textContent    = d.label;
  badge.style.color    = d.color;
  badge.style.background = d.bg;
  badge.style.borderColor = d.color + '40';
  title.textContent    = d.title;
  desc.textContent     = d.desc;
  note.textContent     = d.note;

  qrImage.style.display = 'none';
  qrPDF.style.display = 'none';
  qrPlaceholder.style.display = 'none';

  if (d.qrType === 'image') {
    qrImage.src = d.qrSrc;
    qrImage.style.display = 'block';
  } else if (d.qrType === 'pdf') {
    qrPDF.src = d.qrSrc;
    qrPDF.style.display = 'block';
  } else {
    qrPlaceholder.style.display = 'flex';
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('qrModal').classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('qrModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});
