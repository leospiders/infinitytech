import { useTranslation } from 'react-i18next';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { WHATSAPP_URL } from '../../config';

const C = {
  text: 'var(--c-text)',
  textSec: 'var(--c-text-sec)',
  primary: 'var(--c-primary)',
  surface: 'var(--c-surface)',
  border: 'var(--c-border)',
};

const ITEMS = [
  {
    icon: 'chat', key: 'whatsapp', titleKey: 'landing.contactWhatsapp', descKey: 'landing.contactWhatsappDesc',
    href: `${WHATSAPP_URL}?text=${encodeURIComponent('Hola! Quiero consultar sobre sus productos y servicios')}`,
  },
  { icon: 'call', key: 'phone', titleKey: 'landing.contactPhone', descKey: null, href: null },
  { icon: 'pin_drop', key: 'location', titleKey: 'landing.contactLocation', descKey: 'landing.contactLocationDesc', href: null },
];

export function LandingContact() {
  const { t } = useTranslation();
  return (
    <section id="contacto" className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.primary }}>
          {t('landing.contactLabel', 'HABLEMOS')}
        </span>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: C.text, fontFamily: '"Space Grotesk", sans-serif' }}>
          {t('landing.contactTitle')}
        </h2>
        <p className="text-sm" style={{ color: C.textSec }}>
          {t('landing.contactSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ITEMS.map(({ icon, key, titleKey, descKey, href }) => {
          const isLink = !!href;
          const Wrapper = isLink ? 'a' : 'div';
          const wrapperProps: any = isLink
            ? { href, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <Wrapper
              key={key}
              {...wrapperProps}
              className="group rounded-xl p-5 flex flex-col items-center text-center gap-4 transition-all duration-200"
              style={{
                backgroundColor: C.surface,
                border: '1px solid var(--c-border)',
                cursor: isLink ? 'pointer' : 'default',
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.borderColor = C.primary + '40';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,200,248,0.08)';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.borderColor = 'var(--c-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: 'var(--c-primary-soft)',
                  border: '1px solid rgba(0,200,248,0.15)',
                }}
              >
                <MaterialIcon icon={icon} wght={300} style={{ color: C.primary }} size={24} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold tracking-tight" style={{ color: C.text }}>
                  {t(titleKey)}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: C.textSec }}>
                  {descKey ? t(descKey) : '+591 60574727'}
                </span>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}
