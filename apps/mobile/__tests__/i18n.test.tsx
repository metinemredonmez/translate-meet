import { act, renderHook } from '@testing-library/react-native';
import { parseLanguage, translate, useI18n } from '@/i18n';
import { tr } from '@/i18n/tr';
import { en } from '@/i18n/en';
import { useSettings } from '@/store/settings';

describe('i18n', () => {
  beforeEach(() => {
    useSettings.setState({ appLanguage: 'tr' });
  });

  it('switches language through the hook', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.lang).toBe('tr');
    expect(result.current.t('auth.notSignedIn')).toBe('Giriş yapılmadı');

    act(() => {
      result.current.setLang('en');
    });

    expect(result.current.lang).toBe('en');
    expect(result.current.t('auth.notSignedIn')).toBe('Not signed in');
    expect(result.current.t('tabs.settings')).toBe('Settings');
  });

  it('interpolates params and leaves unknown placeholders', () => {
    expect(translate('en', 'translate.tooLong', { max: 5000 })).toBe('At most 5000 characters.');
    expect(translate('tr', 'converse.state.error')).toBe('Bir hata oluştu ({code}).');
  });

  it('parses device locales', () => {
    expect(parseLanguage('en-US')).toBe('en');
    expect(parseLanguage('tr_TR')).toBe('tr');
    expect(parseLanguage('de-DE')).toBeNull();
    expect(parseLanguage(undefined)).toBeNull();
  });

  it('has the same keys in TR and EN', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
  });
});
