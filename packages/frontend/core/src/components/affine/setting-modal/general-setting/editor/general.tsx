import {
  Loading,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  RadioGroup,
  type RadioItem,
  Scrollable,
  Switch,
} from '@affine/component';
import {
  SettingRow,
  SettingWrapper,
} from '@affine/component/setting-components';
import { useAppSettingHelper } from '@affine/core/hooks/affine/use-app-setting-helper';
import {
  type FontData,
  SystemFontFamilyService,
} from '@affine/core/modules/system-font-family';
import { useI18n } from '@affine/i18n';
import {
  type AppSetting,
  type DocMode,
  type FontFamily,
  fontStyleOptions,
  useLiveData,
  useService,
} from '@toeverything/infra';
import {
  type ChangeEvent,
  forwardRef,
  type HTMLAttributes,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Virtuoso } from 'react-virtuoso';

import { menu, menuTrigger, searchInput, settingWrapper } from './style.css';

const FontFamilySettings = () => {
  const t = useI18n();
  const { appSettings, updateSettings } = useAppSettingHelper();
  const getLabel = useCallback(
    (fontKey: FontFamily) => {
      switch (fontKey) {
        case 'Sans':
          return t['com.affine.appearanceSettings.fontStyle.sans']();
        case 'Serif':
          return t['com.affine.appearanceSettings.fontStyle.serif']();
        case 'Mono':
          return t[`com.affine.appearanceSettings.fontStyle.mono`]();
        case 'Custom':
          return t['com.affine.settings.editorSettings.edgeless.custom']();
        default:
          return '';
      }
    },
    [t]
  );

  const radioItems = useMemo(() => {
    return fontStyleOptions
      .map(({ key, value }) => {
        if (key === 'Custom' && !environment.isDesktop) {
          return null;
        }
        const label = getLabel(key);
        let fontFamily = value;
        if (key === 'Custom' && appSettings.customFontFamily) {
          fontFamily = `${appSettings.customFontFamily}, ${value}`;
        }
        return {
          value: key,
          label,
          testId: 'system-font-style-trigger',
          style: {
            fontFamily,
          },
        } satisfies RadioItem;
      })
      .filter(item => item !== null);
  }, [appSettings.customFontFamily, getLabel]);

  return (
    <RadioGroup
      items={radioItems}
      value={appSettings.fontStyle}
      width={250}
      className={settingWrapper}
      onChange={useCallback(
        (value: AppSetting['fontStyle']) => {
          updateSettings('fontStyle', value);
        },
        [updateSettings]
      )}
    />
  );
};

const getFontFamily = (font: string) => `${font}, ${fontStyleOptions[0].value}`;

const Scroller = forwardRef<
  HTMLDivElement,
  PropsWithChildren<HTMLAttributes<HTMLDivElement>>
>(({ children, ...props }, ref) => {
  return (
    <Scrollable.Root>
      <Scrollable.Viewport {...props} ref={ref}>
        {children}
      </Scrollable.Viewport>
      <Scrollable.Scrollbar />
    </Scrollable.Root>
  );
});

Scroller.displayName = 'Scroller';

const FontMenuItems = ({ onSelect }: { onSelect: (font: string) => void }) => {
  const systemFontFamily = useService(SystemFontFamilyService).systemFontFamily;
  useEffect(() => {
    if (systemFontFamily.fontList$.value.length === 0) {
      systemFontFamily.loadFontList();
    }
    systemFontFamily.clearSearch();
  }, [systemFontFamily]);

  const isLoading = useLiveData(systemFontFamily.isLoading$);
  const result = useLiveData(systemFontFamily.result$);
  const searchText = useLiveData(systemFontFamily.searchText$);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      systemFontFamily.search(e.target.value);
    },
    [systemFontFamily]
  );
  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation(); // avoid typeahead search built-in in the menu
    },
    []
  );

  return (
    <div>
      <input
        value={searchText ?? ''}
        onChange={onInputChange}
        onKeyDown={onInputKeyDown}
        autoFocus
        className={searchInput}
        placeholder="Type here ..."
      />
      <MenuSeparator />
      {isLoading ? (
        <Loading />
      ) : (
        <Scrollable.Root style={{ height: '200px' }}>
          <Scrollable.Viewport>
            {result.length > 0 ? (
              <Virtuoso
                totalCount={result.length}
                components={{
                  Scroller: Scroller,
                }}
                itemContent={index => (
                  <FontMenuItem
                    key={result[index].fullName}
                    font={result[index]}
                    onSelect={onSelect}
                  />
                )}
              />
            ) : (
              <div>No font found</div>
            )}
          </Scrollable.Viewport>
          <Scrollable.Scrollbar />
        </Scrollable.Root>
      )}
    </div>
  );
};

const FontMenuItem = ({
  font,
  onSelect,
}: {
  font: FontData;
  onSelect: (font: string) => void;
}) => {
  const handleFontSelect = useCallback(
    () => onSelect(font.fullName),
    [font, onSelect]
  );
  const fontFamily = getFontFamily(font.family);
  return (
    <MenuItem
      key={font.fullName}
      onSelect={handleFontSelect}
      style={{ fontFamily }}
    >
      {font.fullName}
    </MenuItem>
  );
};

const CustomFontFamilySettings = () => {
  const t = useI18n();
  const { appSettings, updateSettings } = useAppSettingHelper();
  const fontFamily = getFontFamily(appSettings.customFontFamily);
  const onCustomFontFamilyChange = useCallback(
    (fontFamily: string) => {
      updateSettings('customFontFamily', fontFamily);
    },
    [updateSettings]
  );
  if (appSettings.fontStyle !== 'Custom' || !environment.isDesktop) {
    return null;
  }
  return (
    <SettingRow
      name={t[
        'com.affine.settings.editorSettings.general.font-family.custom.title'
      ]()}
      desc={t[
        'com.affine.settings.editorSettings.general.font-family.custom.description'
      ]()}
    >
      <Menu
        items={<FontMenuItems onSelect={onCustomFontFamilyChange} />}
        contentOptions={{
          align: 'end',
          style: { width: '250px' },
        }}
      >
        <MenuTrigger className={menuTrigger} style={{ fontFamily }}>
          {appSettings.customFontFamily || 'Select a font'}
        </MenuTrigger>
      </Menu>
    </SettingRow>
  );
};
const NewDocDefaultModeSettings = () => {
  const t = useI18n();
  const [value, setValue] = useState<DocMode>('page');
  const radioItems = useMemo<RadioItem[]>(
    () => [
      {
        value: 'page',
        label: t['Page'](),
        testId: 'page-mode-trigger',
      },
      {
        value: 'edgeless',
        label: t['Edgeless'](),
        testId: 'edgeless-mode-trigger',
      },
    ],
    [t]
  );
  return (
    <RadioGroup
      items={radioItems}
      value={value}
      width={250}
      className={settingWrapper}
      onChange={setValue}
    />
  );
};

export const General = () => {
  const t = useI18n();
  return (
    <SettingWrapper title={t['com.affine.settings.editorSettings.general']()}>
      <SettingRow
        name={t['com.affine.settings.editorSettings.general.ai.title']()}
        desc={t['com.affine.settings.editorSettings.general.ai.description']()}
      >
        <Switch />
      </SettingRow>
      <SettingRow
        name={t['com.affine.appearanceSettings.font.title']()}
        desc={t['com.affine.appearanceSettings.font.description']()}
      >
        <FontFamilySettings />
      </SettingRow>
      <CustomFontFamilySettings />
      <SettingRow
        name={t[
          'com.affine.settings.editorSettings.general.font-family.title'
        ]()}
        desc={t[
          'com.affine.settings.editorSettings.general.font-family.description'
        ]()}
      >
        <Menu items={<MenuItem>inter</MenuItem>}>
          <MenuTrigger className={menuTrigger} disabled>
            inter
          </MenuTrigger>
        </Menu>
      </SettingRow>
      <SettingRow
        name={t['com.affine.settings.editorSettings.general.font-size.title']()}
        desc={t[
          'com.affine.settings.editorSettings.general.font-size.description'
        ]()}
      >
        <Menu
          contentOptions={{
            className: menu,
          }}
          items={<MenuItem>15</MenuItem>}
        >
          <MenuTrigger className={menuTrigger} disabled>
            15
          </MenuTrigger>
        </Menu>
      </SettingRow>
      <SettingRow
        name={t[
          'com.affine.settings.editorSettings.general.default-new-doc.title'
        ]()}
        desc={t[
          'com.affine.settings.editorSettings.general.default-new-doc.description'
        ]()}
      >
        <NewDocDefaultModeSettings />
      </SettingRow>
      <SettingRow
        name={t[
          'com.affine.settings.editorSettings.general.default-code-block.language.title'
        ]()}
        desc={t[
          'com.affine.settings.editorSettings.general.default-code-block.language.description'
        ]()}
      >
        <Menu
          contentOptions={{
            className: menu,
          }}
          items={<MenuItem>Plain Text</MenuItem>}
        >
          <MenuTrigger className={menuTrigger} disabled>
            Plain Text
          </MenuTrigger>
        </Menu>
      </SettingRow>
      <SettingRow
        name={t[
          'com.affine.settings.editorSettings.general.default-code-block.wrap.title'
        ]()}
        desc={t[
          'com.affine.settings.editorSettings.general.default-code-block.wrap.description'
        ]()}
      >
        <Switch />
      </SettingRow>
      <SettingRow
        name={t[
          'com.affine.settings.editorSettings.general.spell-check.title'
        ]()}
        desc={t[
          'com.affine.settings.editorSettings.general.spell-check.description'
        ]()}
      >
        <Switch />
      </SettingRow>
    </SettingWrapper>
  );
};
