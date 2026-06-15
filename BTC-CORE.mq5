//+------------------------------------------------------------------+
//|                                                     BTC-CORE.mq5 |
//|                                                       BTC-CORE   |
//|        順張りトレンドフォロー + ATR連動ナンピン + 段階別トレール |
//+------------------------------------------------------------------+
#property copyright "BTC-CORE"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\SymbolInfo.mqh>

CTrade         trade;
CPositionInfo  posInfo;
CSymbolInfo    symbolInfo;

//+------------------------------------------------------------------+
//| 入力パラメーター                                                  |
//+------------------------------------------------------------------+

//=== 基本設定 ===
enum ENUM_TRADE_DIRECTION
{
   DIR_BOTH       = 0,   // 両方向(LONG/SHORT両方)
   DIR_ONLY_LONG  = 1,   // LONGのみ
   DIR_ONLY_SHORT = 2    // SHORTのみ
};

input group "===== 基本設定 ====="
input ENUM_TRADE_DIRECTION TradeDirection = DIR_BOTH;  // 自動売買方向制限(MTFとAND条件)
input long   MagicNumberLong  = 20260201;     // ロング用マジックナンバー
input long   MagicNumberShort = 20260202;     // ショート用マジックナンバー
input string EAComment        = "BTC-CORE";   // コメント
input int    SlippagePoints   = 30;           // スリッページ(point)

//=== MTF方向フィルター(長期足) ===
enum ENUM_TREND_METHOD
{
   TREND_EMA_PRICE = 0,   // 終値とEMA(Slow)の位置関係
   TREND_EMA_CROSS = 1,   // EMA(Fast)とEMA(Slow)のクロス
   TREND_BOTH      = 2    // 上記2条件のAND(食い違い時は中立)
};

input group "===== MTF方向フィルター(長期足) ====="
input ENUM_TIMEFRAMES Trend_Timeframe = PERIOD_H4;        // トレンド判定足
input ENUM_TREND_METHOD TrendMethod   = TREND_EMA_PRICE;  // 判定方式
input int    Trend_EMA_Slow = 200;   // 長期EMA期間
input int    Trend_EMA_Fast = 50;    // 短期EMA期間(クロス方式用)

//=== 短期足トリガー(押し目・戻りRSI) ===
input group "===== 短期足トリガー(押し目・戻りRSI) ====="
input ENUM_TIMEFRAMES Trigger_Timeframe = PERIOD_M15;  // トリガー判定足
input int    RSI_Period           = 14;       // RSI期間
input double RSI_PullbackBuyLevel  = 40.0;    // 押し目買いRSIレベル
input double RSI_PullbackSellLevel = 60.0;    // 戻り売りRSIレベル
input bool   RequireRSITurn        = true;    // RSI反転確認を待つ

//=== ポジション保有中の方向反転 ===
input group "===== 方向反転時の挙動 ====="
input bool   StopNanpinOnTrendFlip = false;   // 方向反転時ナンピン停止

//=== ATR基準 ===
input group "===== ATR基準 ====="
input ENUM_TIMEFRAMES ATR_Timeframe = PERIOD_H1;  // ATR基準足
input int    ATR_Period = 14;                     // ATR期間

//=== ナンピン設定(ATR連動) ===
input group "===== ナンピン設定(ATR連動) ====="
input double Nanpin_ATR_Mult    = 0.5;       // ナンピン間隔(ATR倍率)
input int    MaxStages          = 10;        // 最大段数(0=無制限 / デフォルト10)
input bool   UseWeightedAvgBase = true;      // true:加重平均基準 / false:直前ポジション基準
input int    EntryWaitMinutes   = 60;        // エントリー後待機時間(分)
input bool   UseSkipBonus       = true;      // 見送り加算機能ON/OFF
input int    MaxSkipBonus       = 2;         // 最大加算回数(0=無効)

//=== ロット設定 ===
input group "===== ロット設定 ====="
input double StartLot      = 0.01;   // 1段目ロット(自動モード)
input double LotMultiplier = 1.3;    // ナンピン倍率(1.0=均等 / 2.0=完全マーチン)
input double LotStep       = 0.01;   // ロット刻み幅(丸め単位)

//=== TP設定(ATR連動・加重平均から) ===
input group "===== TP設定(ATR連動・加重平均から) ====="
input double TP_ATR_Mult_Stage1to2  = 0.8;   // 1〜2段目TP(ATR倍率)
input double TP_ATR_Mult_Stage3plus = 1.0;   // 3段目以降TP(ATR倍率)

//=== トレール設定(ATR連動・4段階) ===
input group "===== トレール設定(ATR連動・4段階) ====="
input bool   UseTrailingStop = true;   // トレール機能ON/OFF

input int    TrailStage_Boundary1 = 3;     // 浅段の境界(〜N段)
input int    TrailStage_Boundary2 = 6;     // 中段の境界(〜N段)
input int    TrailStage_Boundary3 = 10;    // 深段の境界(〜N段)

// 浅段(1〜境界1) ※全てATR倍率
input double Trail_Shallow_Trigger = 0.6;
input double Trail_Shallow_Width   = 0.4;
input double Trail_Shallow_MinLock = 0.2;

// 中段(境界1+1〜境界2)
input double Trail_Middle_Trigger  = 0.5;
input double Trail_Middle_Width    = 0.3;
input double Trail_Middle_MinLock  = 0.15;

// 深段(境界2+1〜境界3)
input double Trail_Deep_Trigger    = 0.4;
input double Trail_Deep_Width      = 0.2;
input double Trail_Deep_MinLock    = 0.15;

// 最深段(境界3+1〜)
input double Trail_Extreme_Trigger = 0.3;
input double Trail_Extreme_Width   = 0.1;
input double Trail_Extreme_MinLock = 0.15;

//=== 安全クランプ ===
input group "===== 安全クランプ(距離の上下限) ====="
input double MinDistancePips = 5.0;      // 距離の下限(pips)
input double MaxDistancePips = 2000.0;   // 距離の上限(pips)

//=== 合計損益チェック ===
input group "===== 合計損益チェック(トレール決済時のみ) ====="
input bool   UseProfitCheck     = true;   // 合計損益チェック
input double MinTotalProfitJPY  = 0;      // 最低合計利益(円)

//=== 損切り設定 ===
input group "===== 含み損損切り ====="
input bool   UseMaxLoss   = true;         // 含み損損切り機能(BTC対策でデフォルトON)
input double MaxLoss_JPY  = 100000;       // 損切りライン(円)

//=== 曜日フィルター ===
input group "===== 曜日フィルター(BTC土日限定稼働) ====="
input bool 月曜日稼働 = false;   // 月曜日 取引ON/OFF
input bool 火曜日稼働 = false;   // 火曜日 取引ON/OFF
input bool 水曜日稼働 = false;   // 水曜日 取引ON/OFF
input bool 木曜日稼働 = false;   // 木曜日 取引ON/OFF
input bool 金曜日稼働 = false;   // 金曜日 取引ON/OFF
input bool 土曜日稼働 = true;    // 土曜日 取引ON/OFF
input bool 日曜日稼働 = true;    // 日曜日 取引ON/OFF

//=== 時間フィルター(日本時間) ===
input group "===== 時間フィルター(日本時間) ====="
// ※ XM・HFMの夏時間/冬時間は自動切替されます(手動設定不要)
// ※ 0:00〜24:00の範囲で設定してください(24:00は翌0:00扱い)
input bool UseTimeFilter      = false;   // 時間フィルター使用(false=24時間稼働)
input int  TradeStartHour     = 0;       // 取引開始時刻(日本時間 時)
input int  TradeStartMin      = 0;       // 取引開始時刻(日本時間 分)
input int  TradeEndHour       = 24;      // 取引終了時刻(日本時間 時) ※24=翌0時
input int  TradeEndMin        = 0;       // 取引終了時刻(日本時間 分)
input bool NanpinOutsideHours = false;   // 時間外/停止曜日でもナンピン許可

#define AUTH_URL "https://script.google.com/macros/s/AKfycbx7acPhcHcCGbk5VABcbjgW39VAoPD5sohfsUD_zWXt3dVCQKv0bS43rYImjhT_S53DmA/exec"

//+------------------------------------------------------------------+
//| グローバル変数                                                    |
//+------------------------------------------------------------------+
double   g_PipsToPrice;           // 1pipsを価格に変換する係数(BTCUSD固定=1.0)
datetime g_LastLongEntry  = 0;    // 最終ロングエントリー時刻
datetime g_LastShortEntry = 0;    // 最終ショートエントリー時刻

bool     g_TrailActiveLong  = false;  // ロングのトレール発動状態
bool     g_TrailActiveShort = false;  // ショートのトレール発動状態
double   g_TrailHighLong    = 0;      // ロングの最高値(トレール用)
double   g_TrailLowShort    = 0;      // ショートの最安値(トレール用)

// インジケーターハンドル
int      g_EMASlow_Handle = INVALID_HANDLE;  // 長期EMAハンドル
int      g_EMAFast_Handle = INVALID_HANDLE;  // 短期EMAハンドル
int      g_RSI_Handle     = INVALID_HANDLE;  // RSIハンドル
int      g_ATR_Handle     = INVALID_HANDLE;  // ATRハンドル

// 新バー検出キャッシュ
double   g_CachedATR        = 0;      // 確定ATR値(キャッシュ)
datetime g_LastATRBarTime   = 0;      // ATR足の最終バー時刻
int      g_TrendState       = 0;      // MTF方向(1=LONG許可 / -1=SHORT許可 / 0=中立)
datetime g_LastTrendBarTime = 0;      // トレンド足の最終バー時刻
int      g_TriggerSignal    = 0;      // トリガーシグナル(1=BUY / -1=SELL / 0=なし)
datetime g_LastTriggerBar   = 0;      // トリガー足の最終バー時刻
datetime g_LongSignalUsedBar  = 0;    // LONGシグナル消費済みバー時刻
datetime g_ShortSignalUsedBar = 0;    // SHORTシグナル消費済みバー時刻

bool     g_AuthOK = false;        // 認証結果

//+------------------------------------------------------------------+
//| OnInit                                                            |
//+------------------------------------------------------------------+
int OnInit()
{
   // 認証チェック(冒頭で実行)
   g_AuthOK = CheckAuthentication();
   if(!g_AuthOK)
   {
      Print("認証失敗 - EAを停止します");
      Alert("BTC-CORE: 認証に失敗しました。口座番号をご確認ください。");
      return INIT_FAILED;
   }

   // シンボル情報初期化
   if(!symbolInfo.Name(_Symbol))
   {
      Print("シンボル情報取得失敗");
      return INIT_FAILED;
   }
   symbolInfo.RefreshRates();

   // pips換算係数(BTCUSD専用: 1pip = 1ドル固定)
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   g_PipsToPrice = 1.0;

   // インジケーターハンドル作成(EMA×2 / RSI / ATR)
   g_EMASlow_Handle = iMA(_Symbol, Trend_Timeframe, Trend_EMA_Slow, 0, MODE_EMA, PRICE_CLOSE);
   g_EMAFast_Handle = iMA(_Symbol, Trend_Timeframe, Trend_EMA_Fast, 0, MODE_EMA, PRICE_CLOSE);
   g_RSI_Handle     = iRSI(_Symbol, Trigger_Timeframe, RSI_Period, PRICE_CLOSE);
   g_ATR_Handle     = iATR(_Symbol, ATR_Timeframe, ATR_Period);

   if(g_EMASlow_Handle == INVALID_HANDLE || g_EMAFast_Handle == INVALID_HANDLE ||
      g_RSI_Handle == INVALID_HANDLE || g_ATR_Handle == INVALID_HANDLE)
   {
      Print("インジケーターハンドル作成失敗");
      return INIT_FAILED;
   }

   // CTrade初期化
   trade.SetExpertMagicNumber(MagicNumberLong);
   trade.SetDeviationInPoints(SlippagePoints);
   trade.SetTypeFilling(ORDER_FILLING_IOC);

   // 初回キャッシュ計算(データが揃っていれば反映)
   UpdateATRCache();
   UpdateTrendState();

   Print("BTC-CORE v1.00 起動 (BTCUSD専用 / 自動モード固定)");
   Print("通貨ペア: ", _Symbol, " / Digits: ", digits, " / PipsToPrice: ", g_PipsToPrice);
   Print("トレンド足: ", EnumToString(Trend_Timeframe), " / 判定方式: ", EnumToString(TrendMethod),
         " / EMA: ", Trend_EMA_Fast, "/", Trend_EMA_Slow);
   Print("トリガー足: ", EnumToString(Trigger_Timeframe), " / 押し目買い:", RSI_PullbackBuyLevel,
         " / 戻り売り:", RSI_PullbackSellLevel, " / 反転確認:", (RequireRSITurn ? "ON" : "OFF"));
   Print("ATR足: ", EnumToString(ATR_Timeframe), " 期間:", ATR_Period, " / 初期ATR:", g_CachedATR);
   Print("ナンピン基準: ", (UseWeightedAvgBase ? "加重平均" : "直前ポジション"), " / ナンピンATR倍率:", Nanpin_ATR_Mult);

   EventSetTimer(5); // 5秒ごとにコメント更新

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| OnDeinit                                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   if(g_EMASlow_Handle != INVALID_HANDLE) IndicatorRelease(g_EMASlow_Handle);
   if(g_EMAFast_Handle != INVALID_HANDLE) IndicatorRelease(g_EMAFast_Handle);
   if(g_RSI_Handle     != INVALID_HANDLE) IndicatorRelease(g_RSI_Handle);
   if(g_ATR_Handle     != INVALID_HANDLE) IndicatorRelease(g_ATR_Handle);
   Comment("");
   Print("BTC-CORE 停止");
}

//+------------------------------------------------------------------+
//| OnTimer - チャートコメント更新                                    |
//+------------------------------------------------------------------+
void OnTimer()
{
   UpdateChartComment();
}

//+------------------------------------------------------------------+
//| OnTick                                                            |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!g_AuthOK) return;

   symbolInfo.RefreshRates();

   // 新バー検出ベースの再計算(ATR / トレンド / トリガー)
   UpdateATRCache();
   UpdateTrendState();
   UpdateTriggerSignal();

   // 含み損損切りチェック(最優先)
   if(UseMaxLoss)
   {
      CheckMaxLoss();
   }

   // トレール処理(ティック毎)
   if(UseTrailingStop)
   {
      ProcessTrailing(POSITION_TYPE_BUY);
      ProcessTrailing(POSITION_TYPE_SELL);
   }

   // TP決済処理
   CheckTakeProfit(POSITION_TYPE_BUY);
   CheckTakeProfit(POSITION_TYPE_SELL);

   // ナンピン処理(時間外もナンピン許可=ON時は時間/曜日フィルター無視)
   if(NanpinOutsideHours || (IsTradeTimeAllowed() && IsTradeDayAllowed()))
   {
      ProcessNanpin(POSITION_TYPE_BUY);
      ProcessNanpin(POSITION_TYPE_SELL);
   }

   // 新規エントリー(時間・曜日チェック)
   if(IsTradeTimeAllowed() && IsTradeDayAllowed())
   {
      ProcessNewEntry();
   }
}

//+------------------------------------------------------------------+
//| 認証チェック                                                      |
//+------------------------------------------------------------------+
bool CheckAuthentication()
{
   // バックテスト・最適化中は認証スキップ
   if(MQLInfoInteger(MQL_TESTER) || MQLInfoInteger(MQL_OPTIMIZATION))
   {
      Print("バックテストモード: 認証スキップ");
      return true;
   }

   long account = AccountInfoInteger(ACCOUNT_LOGIN);
   string url = AUTH_URL + "?account=" + IntegerToString(account);

   char data[];
   char result[];
   string headers;
   string resultHeaders;

   int timeout = 5000;
   ResetLastError();
   int res = WebRequest("GET", url, "", "", timeout, data, 0, result, resultHeaders);

   if(res == -1)
   {
      int err = GetLastError();
      Print("認証通信失敗 エラー: ", err);
      if(err == 4014)
      {
         Print("【重要】MT5の「ツール > オプション > エキスパートアドバイザ」で");
         Print("「WebRequestを許可するURLリスト」に以下の両方を追加してください:");
         Print("https://script.google.com");
         Print("https://script.googleusercontent.com");
      }
      return false;
   }

   string response = CharArrayToString(result);
   StringTrimLeft(response);
   StringTrimRight(response);

   Print("認証応答: ", response);

   if(response == "OK")
   {
      Print("認証成功 - 口座番号: ", account);
      return true;
   }
   else
   {
      Print("認証拒否 - 口座番号: ", account);
      return false;
   }
}

//+------------------------------------------------------------------+
//| 欧州夏時間(CEST)判定                                             |
//| XM・HFM基準: 3月第2日曜〜11月第1日曜 = 夏時間(GMT+3)            |
//|              それ以外 = 冬時間(GMT+2)                            |
//+------------------------------------------------------------------+
bool IsEuropeanSummerTime(datetime t)
{
   MqlDateTime dt;
   TimeToStruct(t, dt);

   int year  = dt.year;
   int month = dt.mon;
   int day   = dt.day;

   // 3月より前 or 11月より後 → 冬時間
   if(month < 3 || month > 11) return false;
   // 4月〜10月 → 夏時間
   if(month > 3 && month < 11) return true;

   // 3月: 第2日曜日を計算
   MqlDateTime march1;
   TimeToStruct(StringToTime(IntegerToString(year) + ".03.01 00:00"), march1);
   int march1DayOfWeek = march1.day_of_week; // 0=日曜
   int firstSunday = (7 - march1DayOfWeek) % 7 + 1;
   int secondSunday = firstSunday + 7; // 第2日曜日

   if(month == 3)
   {
      return (day >= secondSunday);
   }

   // 11月: 第1日曜日を計算
   MqlDateTime nov1;
   TimeToStruct(StringToTime(IntegerToString(year) + ".11.01 00:00"), nov1);
   int nov1DayOfWeek = nov1.day_of_week;
   int novFirstSunday = (7 - nov1DayOfWeek) % 7 + 1;

   if(month == 11)
   {
      return (day < novFirstSunday);
   }

   return false;
}

//+------------------------------------------------------------------+
//| サーバー時間 → 日本時間(JST)への変換                            |
//| XM・HFM: 夏時間GMT+3 / 冬時間GMT+2 / JST = GMT+9                 |
//+------------------------------------------------------------------+
int GetJSTHour(datetime serverTime)
{
   MqlDateTime dt;
   TimeToStruct(serverTime, dt);

   int serverOffset = IsEuropeanSummerTime(serverTime) ? 3 : 2;
   int jstHour = dt.hour + (9 - serverOffset);

   if(jstHour >= 24) jstHour -= 24;
   if(jstHour < 0)   jstHour += 24;

   return jstHour;
}

//+------------------------------------------------------------------+
//| 取引時間チェック(日本時間・夏冬時間自動切替)                     |
//+------------------------------------------------------------------+
bool IsTradeTimeAllowed()
{
   if(!UseTimeFilter) return true;

   datetime now = TimeCurrent();
   MqlDateTime dt;
   TimeToStruct(now, dt);

   int jstHour = GetJSTHour(now);
   int jstMin  = dt.min;

   int currentMinutes = jstHour * 60 + jstMin;
   int startMinutes   = TradeStartHour * 60 + TradeStartMin;
   int endMinutes     = TradeEndHour   * 60 + TradeEndMin;

   if(endMinutes >= 1440) endMinutes = 1440;

   if(startMinutes < endMinutes)
   {
      return (currentMinutes >= startMinutes && currentMinutes < endMinutes);
   }
   else if(startMinutes > endMinutes)
   {
      return (currentMinutes >= startMinutes || currentMinutes < endMinutes);
   }
   return true;
}

//+------------------------------------------------------------------+
//| 取引曜日チェック                                                  |
//+------------------------------------------------------------------+
bool IsTradeDayAllowed()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);

   switch(dt.day_of_week)
   {
      case 0: return 日曜日稼働;
      case 1: return 月曜日稼働;
      case 2: return 火曜日稼働;
      case 3: return 水曜日稼働;
      case 4: return 木曜日稼働;
      case 5: return 金曜日稼働;
      case 6: return 土曜日稼働;
      default: return false;
   }
}

//+------------------------------------------------------------------+
//| ATRキャッシュ更新(ATR基準足の新バー確定時のみ再計算)            |
//+------------------------------------------------------------------+
void UpdateATRCache()
{
   datetime barTime = iTime(_Symbol, ATR_Timeframe, 0);
   if(barTime == 0) return;
   if(barTime == g_LastATRBarTime && g_CachedATR > 0) return;

   double atr[];
   ArraySetAsSeries(atr, true);
   // 確定足(shift=1)を使用してリペイント防止
   if(CopyBuffer(g_ATR_Handle, 0, 1, 1, atr) <= 0)
      return;

   if(atr[0] > 0)
   {
      g_CachedATR       = atr[0];
      g_LastATRBarTime  = barTime;
   }
}

//+------------------------------------------------------------------+
//| MTF方向フィルター更新(トレンド足の新バー確定時のみ)             |
//+------------------------------------------------------------------+
void UpdateTrendState()
{
   datetime barTime = iTime(_Symbol, Trend_Timeframe, 0);
   if(barTime == 0) return;
   if(barTime == g_LastTrendBarTime) return;

   double emaSlow[];
   ArraySetAsSeries(emaSlow, true);
   if(CopyBuffer(g_EMASlow_Handle, 0, 1, 1, emaSlow) <= 0)
      return;
   double emaS = emaSlow[0];

   double closePrice = iClose(_Symbol, Trend_Timeframe, 1);
   if(closePrice <= 0) return;

   bool priceLong  = (closePrice > emaS);
   bool priceShort = (closePrice < emaS);

   bool crossLong  = false;
   bool crossShort = false;
   if(TrendMethod == TREND_EMA_CROSS || TrendMethod == TREND_BOTH)
   {
      double emaFast[];
      ArraySetAsSeries(emaFast, true);
      if(CopyBuffer(g_EMAFast_Handle, 0, 1, 1, emaFast) <= 0)
         return;
      crossLong  = (emaFast[0] > emaS);
      crossShort = (emaFast[0] < emaS);
   }

   bool longOK  = false;
   bool shortOK = false;
   switch(TrendMethod)
   {
      case TREND_EMA_PRICE:
         longOK = priceLong;  shortOK = priceShort;
         break;
      case TREND_EMA_CROSS:
         longOK = crossLong;  shortOK = crossShort;
         break;
      case TREND_BOTH:
         // 2条件のAND(食い違い時は両方falseとなり中立)
         longOK  = (priceLong  && crossLong);
         shortOK = (priceShort && crossShort);
         break;
   }

   int newState = 0;
   if(longOK && !shortOK)       newState = 1;
   else if(shortOK && !longOK)  newState = -1;
   else                         newState = 0;

   g_TrendState       = newState;
   g_LastTrendBarTime = barTime;
}

//+------------------------------------------------------------------+
//| トリガーシグナル更新(トリガー足の新バー確定時のみ)              |
//+------------------------------------------------------------------+
void UpdateTriggerSignal()
{
   datetime barTime = iTime(_Symbol, Trigger_Timeframe, 0);
   if(barTime == 0) return;
   if(barTime == g_LastTriggerBar) return;
   g_LastTriggerBar = barTime;

   double rsi[];
   ArraySetAsSeries(rsi, true);
   // shift0(形成中) / shift1(確定) / shift2(確定前) を取得
   // 3本揃わない場合(起動直後/ヒストリー不足)は rsi[2] 範囲外を避けて中断
   if(CopyBuffer(g_RSI_Handle, 0, 0, 3, rsi) < 3)
   {
      g_TriggerSignal = 0;
      return;
   }

   double rsi1 = rsi[1]; // 確定足 RSI[1]
   double rsi2 = rsi[2]; // 確定足 RSI[2]

   bool buy  = false;
   bool sell = false;

   if(RequireRSITurn)
   {
      // レベルを下から上抜けで押し目買い反転確定
      buy  = (rsi2 <  RSI_PullbackBuyLevel  && rsi1 >= RSI_PullbackBuyLevel);
      // レベルを上から下抜けで戻り売り反転確定
      sell = (rsi2 >  RSI_PullbackSellLevel && rsi1 <= RSI_PullbackSellLevel);
   }
   else
   {
      // レベル到達で即シグナル
      buy  = (rsi1 <= RSI_PullbackBuyLevel);
      sell = (rsi1 >= RSI_PullbackSellLevel);
   }

   if(buy)       g_TriggerSignal = 1;
   else if(sell) g_TriggerSignal = -1;
   else          g_TriggerSignal = 0;
}

//+------------------------------------------------------------------+
//| ATR倍率 → 価格距離への変換(クランプ適用・一元化)               |
//+------------------------------------------------------------------+
double ATRDistance(double atrMult)
{
   double dist = g_CachedATR * atrMult;
   double minD = MinDistancePips * g_PipsToPrice;
   double maxD = MaxDistancePips * g_PipsToPrice;
   return MathMin(MathMax(dist, minD), maxD);
}

//+------------------------------------------------------------------+
//| 現在のトレンド状態名                                              |
//+------------------------------------------------------------------+
string GetTrendStateName(int state)
{
   if(state == 1)  return "LONG許可";
   if(state == -1) return "SHORT許可";
   return "中立";
}

//+------------------------------------------------------------------+
//| 指定方向のポジション数取得                                        |
//+------------------------------------------------------------------+
int CountPositions(ENUM_POSITION_TYPE type)
{
   int count = 0;
   long magic = (type == POSITION_TYPE_BUY) ? MagicNumberLong : MagicNumberShort;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == magic &&
            posInfo.PositionType() == type)
         {
            count++;
         }
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| 加重平均価格計算                                                  |
//+------------------------------------------------------------------+
double CalcWeightedAverage(ENUM_POSITION_TYPE type)
{
   long magic = (type == POSITION_TYPE_BUY) ? MagicNumberLong : MagicNumberShort;
   double totalPriceLot = 0;
   double totalLot = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == magic &&
            posInfo.PositionType() == type)
         {
            totalPriceLot += posInfo.PriceOpen() * posInfo.Volume();
            totalLot      += posInfo.Volume();
         }
      }
   }

   if(totalLot <= 0) return 0;
   return totalPriceLot / totalLot;
}

//+------------------------------------------------------------------+
//| 合計ロット計算                                                    |
//+------------------------------------------------------------------+
double CalcTotalLots(ENUM_POSITION_TYPE type)
{
   long magic = (type == POSITION_TYPE_BUY) ? MagicNumberLong : MagicNumberShort;
   double total = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == magic &&
            posInfo.PositionType() == type)
         {
            total += posInfo.Volume();
         }
      }
   }
   return total;
}

//+------------------------------------------------------------------+
//| 合計含み損益計算(円換算)                                        |
//+------------------------------------------------------------------+
double CalcTotalProfit(ENUM_POSITION_TYPE type)
{
   long magic = (type == POSITION_TYPE_BUY) ? MagicNumberLong : MagicNumberShort;
   double total = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == magic &&
            posInfo.PositionType() == type)
         {
            total += posInfo.Profit() + posInfo.Swap() + posInfo.Commission();
         }
      }
   }
   return total;
}

//+------------------------------------------------------------------+
//| 最新ポジションの価格取得                                          |
//+------------------------------------------------------------------+
double GetLastPositionPrice(ENUM_POSITION_TYPE type)
{
   long magic = (type == POSITION_TYPE_BUY) ? MagicNumberLong : MagicNumberShort;
   datetime latestTime = 0;
   double latestPrice = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == magic &&
            posInfo.PositionType() == type)
         {
            if(posInfo.Time() > latestTime)
            {
               latestTime = posInfo.Time();
               latestPrice = posInfo.PriceOpen();
            }
         }
      }
   }
   return latestPrice;
}

//+------------------------------------------------------------------+
//| 段数別ロット取得                                                  |
//+------------------------------------------------------------------+
double GetLotForStage(int stage)
{
   if(stage <= 0) return 0;

   double baseLot = StartLot;

   if(stage == 1) return NormalizeLot(baseLot);

   double lot = baseLot;
   for(int i = 1; i < stage; i++)
      lot *= LotMultiplier;

   return NormalizeLot(lot);
}

//+------------------------------------------------------------------+
//| ロットをLotStep刻みに丸める                                       |
//+------------------------------------------------------------------+
double NormalizeLot(double lot)
{
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step    = (LotStep > 0) ? LotStep : SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   lot = MathFloor(lot / step) * step;
   lot = MathMax(lot, minLot);
   lot = MathMin(lot, maxLot);
   return NormalizeDouble(lot, 2);
}

//+------------------------------------------------------------------+
//| 段数別TP取得(ATR倍率)                                          |
//+------------------------------------------------------------------+
double GetTPMultForStage(int stage)
{
   if(stage <= 2) return TP_ATR_Mult_Stage1to2;
   return TP_ATR_Mult_Stage3plus;
}

//+------------------------------------------------------------------+
//| 段数別トレール設定取得(ATR倍率)                                |
//+------------------------------------------------------------------+
void GetTrailParams(int stage, double &triggerMult, double &widthMult, double &minLockMult)
{
   if(stage <= TrailStage_Boundary1)
   {
      triggerMult = Trail_Shallow_Trigger;
      widthMult   = Trail_Shallow_Width;
      minLockMult = Trail_Shallow_MinLock;
   }
   else if(stage <= TrailStage_Boundary2)
   {
      triggerMult = Trail_Middle_Trigger;
      widthMult   = Trail_Middle_Width;
      minLockMult = Trail_Middle_MinLock;
   }
   else if(stage <= TrailStage_Boundary3)
   {
      triggerMult = Trail_Deep_Trigger;
      widthMult   = Trail_Deep_Width;
      minLockMult = Trail_Deep_MinLock;
   }
   else
   {
      triggerMult = Trail_Extreme_Trigger;
      widthMult   = Trail_Extreme_Width;
      minLockMult = Trail_Extreme_MinLock;
   }
}

//+------------------------------------------------------------------+
//| 新規エントリー処理(MTF方向 AND 方向制限 AND RSIトリガー)        |
//+------------------------------------------------------------------+
void ProcessNewEntry()
{
   // 中立 or シグナル無しは何もしない
   if(g_TrendState == 0)   return;
   if(g_TriggerSignal == 0) return;

   datetime sigBar = g_LastTriggerBar;

   // BUY新規(MTFがLONG許可 かつ トリガーBUY かつ 方向制限OK)
   if(g_TriggerSignal == 1 && g_TrendState == 1 &&
      CountPositions(POSITION_TYPE_BUY) == 0 &&
      (TradeDirection == DIR_BOTH || TradeDirection == DIR_ONLY_LONG) &&
      g_LongSignalUsedBar != sigBar)
   {
      g_LongSignalUsedBar = sigBar; // 同一バー重複エントリー防止
      OpenPosition(POSITION_TYPE_BUY, 1);
   }

   // SELL新規(MTFがSHORT許可 かつ トリガーSELL かつ 方向制限OK)
   if(g_TriggerSignal == -1 && g_TrendState == -1 &&
      CountPositions(POSITION_TYPE_SELL) == 0 &&
      (TradeDirection == DIR_BOTH || TradeDirection == DIR_ONLY_SHORT) &&
      g_ShortSignalUsedBar != sigBar)
   {
      g_ShortSignalUsedBar = sigBar; // 同一バー重複エントリー防止
      OpenPosition(POSITION_TYPE_SELL, 1);
   }
}

//+------------------------------------------------------------------+
//| ナンピン処理(ATR連動)                                          |
//+------------------------------------------------------------------+
void ProcessNanpin(ENUM_POSITION_TYPE type)
{
   int stages = CountPositions(type);
   if(stages == 0) return;
   if(MaxStages > 0 && stages >= MaxStages) return; // 0=無制限

   // 自動売買方向制限
   if(type == POSITION_TYPE_BUY  && TradeDirection == DIR_ONLY_SHORT) return;
   if(type == POSITION_TYPE_SELL && TradeDirection == DIR_ONLY_LONG)  return;

   // 方向反転時ナンピン停止(ONのとき)
   if(StopNanpinOnTrendFlip)
   {
      if(type == POSITION_TYPE_BUY  && g_TrendState == -1) return;
      if(type == POSITION_TYPE_SELL && g_TrendState == 1)  return;
   }

   // 待機時間チェック
   datetime lastEntry = (type == POSITION_TYPE_BUY) ? g_LastLongEntry : g_LastShortEntry;
   if(TimeCurrent() - lastEntry < EntryWaitMinutes * 60) return;

   // 基準価格を決定(加重平均 or 直前ポジション)
   double basePrice;
   if(UseWeightedAvgBase)
      basePrice = CalcWeightedAverage(type);
   else
      basePrice = GetLastPositionPrice(type);

   if(basePrice <= 0) return;

   // ナンピン距離(ATR連動)
   double nanpinDist = ATRDistance(Nanpin_ATR_Mult);

   double currentPrice = (type == POSITION_TYPE_BUY) ? symbolInfo.Bid() : symbolInfo.Ask();
   double triggerPrice;
   bool shouldNanpin = false;

   if(type == POSITION_TYPE_BUY)
   {
      triggerPrice = basePrice - nanpinDist;
      shouldNanpin = (currentPrice <= triggerPrice);
   }
   else
   {
      triggerPrice = basePrice + nanpinDist;
      shouldNanpin = (currentPrice >= triggerPrice);
   }

   if(shouldNanpin)
   {
      // 見送り加算計算: 乖離距離 ÷ ナンピン距離(ATR版)で本来段数を逆算
      int skipBonus = 0;
      if(UseSkipBonus && MaxSkipBonus > 0 && nanpinDist > 0)
      {
         double divergence = MathAbs(currentPrice - basePrice);
         int shouldHaveStages = (int)MathFloor(divergence / nanpinDist);
         int skipCount = shouldHaveStages - 1; // 1段は通常ナンピン分なので除外
         skipBonus = (int)MathMin(skipCount, MaxSkipBonus);
         if(skipBonus < 0) skipBonus = 0;

         if(skipBonus > 0)
         {
            double divergencePips = divergence / g_PipsToPrice;
            Print((type == POSITION_TYPE_BUY ? "BUY " : "SELL "),
                  "見送り加算 乖離:", DoubleToString(divergencePips, 1), "pips ",
                  "本来段数:", shouldHaveStages, " 加算:", skipBonus, "回");
         }
      }

      OpenPosition(type, stages + 1, skipBonus);
   }
}

//+------------------------------------------------------------------+
//| ポジション建て(FillingモードFOK自動リトライ付き)               |
//+------------------------------------------------------------------+
bool OpenPosition(ENUM_POSITION_TYPE type, int stage, int skipBonus = 0)
{
   double lot = GetLotForStage(stage);
   if(lot <= 0) return false;

   // 見送り加算: ロットを (1 + skipBonus) 倍
   if(skipBonus > 0)
   {
      lot = NormalizeLot(lot * (1 + skipBonus));
   }

   long magic = (type == POSITION_TYPE_BUY) ? MagicNumberLong : MagicNumberShort;
   trade.SetExpertMagicNumber(magic);

   string comment = EAComment + "_" + IntegerToString(stage);
   if(skipBonus > 0) comment += "_skip" + IntegerToString(skipBonus);
   bool result = false;

   if(type == POSITION_TYPE_BUY)
   {
      result = trade.Buy(lot, _Symbol, 0, 0, 0, comment);
      // Retcode 10030(Unsupported filling mode)時はFOKでリトライ
      if(!result && trade.ResultRetcode() == 10030)
      {
         Print("約定失敗(filling非対応) → FOKでリトライ");
         trade.SetTypeFilling(ORDER_FILLING_FOK);
         result = trade.Buy(lot, _Symbol, 0, 0, 0, comment);
      }
      if(result)
      {
         g_LastLongEntry = TimeCurrent();
         g_TrailActiveLong = false;
         g_TrailHighLong = 0;
         Print("BUY ", stage, "段目 約定 Lot:", lot, (skipBonus>0 ? " (skip+"+IntegerToString(skipBonus)+")" : ""),
               " ATR:", DoubleToString(g_CachedATR, _Digits),
               " ナンピン幅:", DoubleToString(ATRDistance(Nanpin_ATR_Mult), _Digits),
               " TP距離:", DoubleToString(ATRDistance(GetTPMultForStage(stage)), _Digits));
      }
   }
   else
   {
      result = trade.Sell(lot, _Symbol, 0, 0, 0, comment);
      if(!result && trade.ResultRetcode() == 10030)
      {
         Print("約定失敗(filling非対応) → FOKでリトライ");
         trade.SetTypeFilling(ORDER_FILLING_FOK);
         result = trade.Sell(lot, _Symbol, 0, 0, 0, comment);
      }
      if(result)
      {
         g_LastShortEntry = TimeCurrent();
         g_TrailActiveShort = false;
         g_TrailLowShort = 0;
         Print("SELL ", stage, "段目 約定 Lot:", lot, (skipBonus>0 ? " (skip+"+IntegerToString(skipBonus)+")" : ""),
               " ATR:", DoubleToString(g_CachedATR, _Digits),
               " ナンピン幅:", DoubleToString(ATRDistance(Nanpin_ATR_Mult), _Digits),
               " TP距離:", DoubleToString(ATRDistance(GetTPMultForStage(stage)), _Digits));
      }
   }

   if(!result)
   {
      Print("約定失敗: ", trade.ResultRetcodeDescription(), " RetCode:", trade.ResultRetcode());
   }

   return result;
}

//+------------------------------------------------------------------+
//| TP決済チェック(ATR連動)                                        |
//+------------------------------------------------------------------+
void CheckTakeProfit(ENUM_POSITION_TYPE type)
{
   int stages = CountPositions(type);
   if(stages == 0) return;

   double avgPrice = CalcWeightedAverage(type);
   double tpDist   = ATRDistance(GetTPMultForStage(stages));
   double tpPrice;
   bool shouldClose = false;

   double currentPrice = (type == POSITION_TYPE_BUY) ? symbolInfo.Bid() : symbolInfo.Ask();

   if(type == POSITION_TYPE_BUY)
   {
      tpPrice = avgPrice + tpDist;
      shouldClose = (currentPrice >= tpPrice);
   }
   else
   {
      tpPrice = avgPrice - tpDist;
      shouldClose = (currentPrice <= tpPrice);
   }

   if(shouldClose)
   {
      // TP決済時も合計損益がプラスであることを確認(スプレッド分マイナス防止)
      if(UseProfitCheck)
      {
         double totalProfit = CalcTotalProfit(type);
         if(totalProfit < MinTotalProfitJPY)
         {
            Print("TP到達だが損益不足で見送り 損益:", totalProfit);
            return;
         }
      }
      Print("TP決済発動 ", (type == POSITION_TYPE_BUY ? "BUY" : "SELL"),
            " 段数:", stages, " 加重平均:", avgPrice, " TP価格:", tpPrice,
            " 利益:", CalcTotalProfit(type));
      CloseAllPositions(type);
   }
}

//+------------------------------------------------------------------+
//| トレール処理(ATR連動)                                          |
//+------------------------------------------------------------------+
void ProcessTrailing(ENUM_POSITION_TYPE type)
{
   int stages = CountPositions(type);
   if(stages == 0) return;

   double avgPrice = CalcWeightedAverage(type);
   double triggerMult, widthMult, minLockMult;
   GetTrailParams(stages, triggerMult, widthMult, minLockMult);

   double triggerDist = ATRDistance(triggerMult);
   double widthDist   = ATRDistance(widthMult);
   double minLockDist = ATRDistance(minLockMult);

   // 最低保証はスプレッド + 0.5pips を下駄として維持
   double spreadFloor = (symbolInfo.Ask() - symbolInfo.Bid()) + 0.5 * g_PipsToPrice;
   minLockDist = MathMax(minLockDist, spreadFloor);

   double currentPrice = (type == POSITION_TYPE_BUY) ? symbolInfo.Bid() : symbolInfo.Ask();
   double triggerPrice;
   double minLockPrice;

   if(type == POSITION_TYPE_BUY)
   {
      triggerPrice = avgPrice + triggerDist;
      minLockPrice = avgPrice + minLockDist;

      if(!g_TrailActiveLong && currentPrice >= triggerPrice)
      {
         g_TrailActiveLong = true;
         g_TrailHighLong = currentPrice;
         Print("BUY トレール発動 価格:", currentPrice, " 段数:", stages);
      }

      if(g_TrailActiveLong)
      {
         if(currentPrice > g_TrailHighLong)
            g_TrailHighLong = currentPrice;

         double trailSL = g_TrailHighLong - widthDist;
         double finalSL = MathMax(trailSL, minLockPrice);

         if(currentPrice <= finalSL)
         {
            if(UseProfitCheck)
            {
               double totalProfit = CalcTotalProfit(type);
               if(totalProfit < MinTotalProfitJPY)
                  return;
            }
            Print("BUY トレール決済 SL:", finalSL, " 利益:", CalcTotalProfit(type));
            CloseAllPositions(type);
         }
      }
   }
   else // SELL
   {
      triggerPrice = avgPrice - triggerDist;
      minLockPrice = avgPrice - minLockDist;

      if(!g_TrailActiveShort && currentPrice <= triggerPrice)
      {
         g_TrailActiveShort = true;
         g_TrailLowShort = currentPrice;
         Print("SELL トレール発動 価格:", currentPrice, " 段数:", stages);
      }

      if(g_TrailActiveShort)
      {
         if(currentPrice < g_TrailLowShort)
            g_TrailLowShort = currentPrice;

         double trailSL = g_TrailLowShort + widthDist;
         double finalSL = MathMin(trailSL, minLockPrice);

         if(currentPrice >= finalSL)
         {
            if(UseProfitCheck)
            {
               double totalProfit = CalcTotalProfit(type);
               if(totalProfit < MinTotalProfitJPY)
                  return;
            }
            Print("SELL トレール決済 SL:", finalSL, " 利益:", CalcTotalProfit(type));
            CloseAllPositions(type);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| 含み損損切りチェック                                              |
//+------------------------------------------------------------------+
void CheckMaxLoss()
{
   double totalProfit = CalcTotalProfit(POSITION_TYPE_BUY) + CalcTotalProfit(POSITION_TYPE_SELL);

   if(totalProfit <= -MaxLoss_JPY)
   {
      Print("含み損損切り発動 合計損益:", totalProfit);
      CloseAllPositions(POSITION_TYPE_BUY);
      CloseAllPositions(POSITION_TYPE_SELL);
   }
}

//+------------------------------------------------------------------+
//| 指定方向の全ポジション決済                                        |
//+------------------------------------------------------------------+
void CloseAllPositions(ENUM_POSITION_TYPE type)
{
   long magic = (type == POSITION_TYPE_BUY) ? MagicNumberLong : MagicNumberShort;
   trade.SetExpertMagicNumber(magic);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol &&
            posInfo.Magic() == magic &&
            posInfo.PositionType() == type)
         {
            ulong ticket = posInfo.Ticket();
            if(!trade.PositionClose(ticket) && trade.ResultRetcode() == 10030)
            {
               // Filling非対応時はFOKでリトライ
               trade.SetTypeFilling(ORDER_FILLING_FOK);
               trade.PositionClose(ticket);
            }
         }
      }
   }

   // フラグリセット
   if(type == POSITION_TYPE_BUY)
   {
      g_TrailActiveLong = false;
      g_TrailHighLong = 0;
      g_LastLongEntry = 0;
   }
   else
   {
      g_TrailActiveShort = false;
      g_TrailLowShort = 0;
      g_LastShortEntry = 0;
   }
}

//+------------------------------------------------------------------+
//| チャートコメント更新                                              |
//+------------------------------------------------------------------+
void UpdateChartComment()
{
   string comment = "";
   comment += "=========================================\n";
   comment += "  BTC-CORE v1.00\n";
   comment += "=========================================\n\n";

   // === TREND(MTF方向フィルター)===
   comment += "[TREND]\n";
   comment += "        判定足: " + EnumToString(Trend_Timeframe) +
              " / 方式: " + EnumToString(TrendMethod) + "\n";
   comment += "        方向: " + GetTrendStateName(g_TrendState) + "\n";

   comment += "\n";

   // === ATR(キャッシュ値と実距離)===
   double atrPips    = (g_PipsToPrice > 0) ? g_CachedATR / g_PipsToPrice : 0;
   double nanpinDist = ATRDistance(Nanpin_ATR_Mult);
   double tp12Dist   = ATRDistance(TP_ATR_Mult_Stage1to2);
   double tp3Dist    = ATRDistance(TP_ATR_Mult_Stage3plus);
   double tTrig, tWid, tLock;
   GetTrailParams(1, tTrig, tWid, tLock);
   comment += "[ATR]\n";
   comment += "        ATR(" + EnumToString(ATR_Timeframe) + "): " + DoubleToString(g_CachedATR, _Digits) +
              " (" + DoubleToString(atrPips, 1) + "pips)\n";
   comment += "        ナンピン幅: " + DoubleToString(nanpinDist, _Digits) +
              " (" + DoubleToString(nanpinDist / g_PipsToPrice, 1) + "pips)\n";
   comment += "        TP 1-2段: " + DoubleToString(tp12Dist, _Digits) +
              " / 3段〜: " + DoubleToString(tp3Dist, _Digits) + "\n";
   comment += "        Trail浅段: 発動" + DoubleToString(ATRDistance(tTrig), _Digits) +
              " / 幅" + DoubleToString(ATRDistance(tWid), _Digits) +
              " / 保証" + DoubleToString(ATRDistance(tLock), _Digits) + "\n";

   comment += "\n";

   // === LONG情報 ===
   int longStages = CountPositions(POSITION_TYPE_BUY);
   if(longStages > 0)
   {
      double longAvg   = CalcWeightedAverage(POSITION_TYPE_BUY);
      double longLots  = CalcTotalLots(POSITION_TYPE_BUY);
      double longPL    = CalcTotalProfit(POSITION_TYPE_BUY);
      double longTPdist = ATRDistance(GetTPMultForStage(longStages));
      double longTPprice = longAvg + longTPdist;
      double trig, wid, lock;
      GetTrailParams(longStages, trig, wid, lock);
      string trailMode = GetTrailModeName(longStages);

      comment += "[LONG]  Active: " + IntegerToString(longStages) + "段 / " + IntegerToString(MaxStages) + "段\n";
      comment += "        Avg Price: " + DoubleToString(longAvg, _Digits) + "\n";
      comment += "        Total Lots: " + DoubleToString(longLots, 2) + "\n";
      comment += "        Floating P/L: " + DoubleToString(longPL, 0) + " JPY\n";
      comment += "        TP Target: " + DoubleToString(longTPprice, _Digits) +
                 " (+" + DoubleToString(longTPdist / g_PipsToPrice, 1) + "pips)\n";
      comment += "        Trail: " + trailMode + " 状態:" + (g_TrailActiveLong ? "発動中" : "待機中") + "\n";
   }
   else
   {
      comment += "[LONG]  Active: 0段\n";
      comment += "        Status: エントリー待機中\n";
   }

   comment += "\n";

   // === SHORT情報 ===
   int shortStages = CountPositions(POSITION_TYPE_SELL);
   if(shortStages > 0)
   {
      double shortAvg   = CalcWeightedAverage(POSITION_TYPE_SELL);
      double shortLots  = CalcTotalLots(POSITION_TYPE_SELL);
      double shortPL    = CalcTotalProfit(POSITION_TYPE_SELL);
      double shortTPdist = ATRDistance(GetTPMultForStage(shortStages));
      double shortTPprice = shortAvg - shortTPdist;
      double trig, wid, lock;
      GetTrailParams(shortStages, trig, wid, lock);
      string trailMode = GetTrailModeName(shortStages);

      comment += "[SHORT] Active: " + IntegerToString(shortStages) + "段 / " + IntegerToString(MaxStages) + "段\n";
      comment += "        Avg Price: " + DoubleToString(shortAvg, _Digits) + "\n";
      comment += "        Total Lots: " + DoubleToString(shortLots, 2) + "\n";
      comment += "        Floating P/L: " + DoubleToString(shortPL, 0) + " JPY\n";
      comment += "        TP Target: " + DoubleToString(shortTPprice, _Digits) +
                 " (-" + DoubleToString(shortTPdist / g_PipsToPrice, 1) + "pips)\n";
      comment += "        Trail: " + trailMode + " 状態:" + (g_TrailActiveShort ? "発動中" : "待機中") + "\n";
   }
   else
   {
      comment += "[SHORT] Active: 0段\n";
      comment += "        Status: エントリー待機中\n";
   }

   comment += "\n";

   // === NEXT NANPIN ===
   comment += "[NEXT NANPIN]\n";
   if(longStages > 0)
   {
      double longBase = UseWeightedAvgBase ? CalcWeightedAverage(POSITION_TYPE_BUY) : GetLastPositionPrice(POSITION_TYPE_BUY);
      double longTrig = longBase - nanpinDist;
      comment += "        Long基準: " + DoubleToString(longBase, _Digits) +
                 " 発動: " + DoubleToString(longTrig, _Digits) + "\n";
   }
   else
   {
      comment += "        Long: --\n";
   }
   if(shortStages > 0)
   {
      double shortBase = UseWeightedAvgBase ? CalcWeightedAverage(POSITION_TYPE_SELL) : GetLastPositionPrice(POSITION_TYPE_SELL);
      double shortTrig = shortBase + nanpinDist;
      comment += "        Short基準: " + DoubleToString(shortBase, _Digits) +
                 " 発動: " + DoubleToString(shortTrig, _Digits) + "\n";
   }
   else
   {
      comment += "        Short: --\n";
   }

   comment += "\n";

   // === RSIトリガー ===
   comment += "[RSI(" + EnumToString(Trigger_Timeframe) + ") トリガー] " +
              " 押し目買い:" + DoubleToString(RSI_PullbackBuyLevel, 0) +
              " / 戻り売り:" + DoubleToString(RSI_PullbackSellLevel, 0) +
              " / 反転確認:" + (RequireRSITurn ? "ON" : "OFF") + "\n";
   string sigName = (g_TriggerSignal == 1) ? "BUYシグナル" : (g_TriggerSignal == -1 ? "SELLシグナル" : "なし");
   comment += "        現在シグナル: " + sigName + "\n";

   comment += "\n";

   // === ACCOUNT ===
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double marginLvl = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   comment += "[ACCOUNT]\n";
   comment += "        Balance: " + DoubleToString(balance, 0) + " JPY\n";
   comment += "        Equity:  " + DoubleToString(equity, 0) + " JPY\n";
   comment += "        Margin Lvl: " + DoubleToString(marginLvl, 1) + "%\n";

   comment += "\n";

   // === FILTERS ===
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   string dayName[] = {"日","月","火","水","木","金","土"};
   double spreadPips = (symbolInfo.Ask() - symbolInfo.Bid()) / g_PipsToPrice;

   int jstHour = GetJSTHour(TimeCurrent());
   bool isSummer = IsEuropeanSummerTime(TimeCurrent());
   string dstLabel = isSummer ? "夏時間(GMT+3)" : "冬時間(GMT+2)";

   comment += "[FILTERS]\n";
   comment += "        JST: " + IntegerToString(jstHour) + ":" +
              (dt.min < 10 ? "0" : "") + IntegerToString(dt.min) +
              " / Server: " + IntegerToString(dt.hour) + ":" +
              (dt.min < 10 ? "0" : "") + IntegerToString(dt.min) +
              " [" + dstLabel + "]\n";
   comment += "        Day: " + dayName[dt.day_of_week] + "曜 (" +
              (IsTradeDayAllowed() ? "許可" : "停止") + ")\n";
   comment += "        Time: " + (IsTradeTimeAllowed() ? "取引時間内" : "時間外") + "\n";
   comment += "        Spread: " + DoubleToString(spreadPips, 1) + " pips\n";

   Comment(comment);
}

//+------------------------------------------------------------------+
//| トレールモード名取得                                              |
//+------------------------------------------------------------------+
string GetTrailModeName(int stage)
{
   if(stage <= TrailStage_Boundary1) return "浅段";
   if(stage <= TrailStage_Boundary2) return "中段";
   if(stage <= TrailStage_Boundary3) return "深段";
   return "最深段";
}
//+------------------------------------------------------------------+
