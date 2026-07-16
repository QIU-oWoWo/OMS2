import type { ThemeConfig } from 'antd';

// 雅迪品牌配色：白+橙
const theme: ThemeConfig = {
  token: {
    colorPrimary: '#FF6B00',
    colorInfo: '#FF6B00',
    colorSuccess: '#16A34A',
    colorWarning: '#F59E0B',
    colorError: '#E11D48',
    colorTextBase: '#1A1A1A',
    colorBgBase: '#FFFFFF',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F5F5',
    borderRadius: 6,
    fontSize: 14,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    controlHeight: 36,
    lineHeight: 1.5715,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 56,
      siderBg: '#1A1A1A',
      triggerBg: '#262626',
      triggerColor: '#FFFFFF',
    },
    Menu: {
      darkItemBg: '#1A1A1A',
      darkItemColor: '#BFBFBF',
      darkItemHoverColor: '#FFFFFF',
      darkItemHoverBg: '#FF6B00',
      darkItemSelectedColor: '#FFFFFF',
      darkItemSelectedBg: '#FF6B00',
      darkSubMenuItemBg: '#141414',
      itemBorderRadius: 0,
      itemMarginInline: 0,
      itemMarginBlock: 0,
    },
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#595959',
      rowHoverBg: '#FFF3E8',
      borderColor: '#F0F0F0',
      cellPaddingBlock: 10,
      cellPaddingInline: 12,
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(255,107,0,0.1)',
      borderRadius: 6,
    },
    Tabs: {
      inkBarColor: '#FF6B00',
      itemActiveColor: '#FF6B00',
      itemHoverColor: '#FF8533',
      itemSelectedColor: '#FF6B00',
    },
    Card: {
      borderRadiusLG: 8,
    },
    Input: {
      activeBorderColor: '#FF6B00',
      hoverBorderColor: '#FF8533',
    },
    Select: {
      optionSelectedBg: '#FFF3E8',
      optionSelectedColor: '#FF6B00',
    },
    Pagination: {
      itemActiveBg: '#FF6B00',
    },
    Steps: {
      colorPrimary: '#FF6B00',
      dotSize: 8,
    },
    Badge: {
      colorPrimary: '#E11D48',
    },
    Tag: {
      borderRadiusSM: 4,
    },
  },
};

export default theme;
