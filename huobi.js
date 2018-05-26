// api https://api.huobi.pro/v1/common/currencys
// https://api.huobi.pro/market/history/kline?symbol=soceth&period=1min&size=1

class Huobi {
    constructor() {
        this.raiseColor = '#589064'; // 上涨色
        this.fallColor = '#ae4d54'; // 下跌色
        this.equalColor = '#999'; // 不跌不涨色
        this.bgColor = '#181b2a'; // 背景色
        this.currencyType = 'usdt'; // 币种类型，可能值为[usdt, btc ,eth]
        this.symbolApi = 'https://api.huobi.br.com/v1/common/symbols'; // 所有币种接口地址
        this.kline = 'return ' + '`https://api.huobi.br.com/market/history/kline?period=1min&size=1&symbol=${currency}${this.currencyType}`'; // K线图接口地址
        this.refreshTime = 1500; // 自动刷新时间，单位是毫秒
        this.currencyList = [];
        this.listData = [];
        this.getPriceInterval = null;

        this.render();
        this.getCurrencys();
        this.startInterval();
    }

    // 动态k线图接口地址
    klineApi(currency, size) {
        return `https://api.huobi.br.com/market/history/kline?symbol=${currency}${this.currencyType}&period=1min&size=${size || 1}`;
    }

    // 获取所有币种
    getCurrencys() {
        let currencyList = $cache.get('currencyList');
        
        if (currencyList) {
            this.currencyList = currencyList;
            this.renderCurrencys();
            return;
        }

        $http.get({
            url: this.symbolApi,
            handler: (res) => {
                let resList = res.data && res.data.data;
                if (resList instanceof Array) {
                    let list = resList.filter((item, index) => {
                        item.favorite = index === 0;
                        return item['quote-currency'] === this.currencyType;
                    });
                    // list[0].favorite = true;
                    $cache.set('currencyList', list);
                    this.currencyList = list;
                    this.renderCurrencys();
                }
            }
        });
        
    }

    // 开始循环刷新数据
    startInterval() {
        this.refreshPrice();
        
        if (this.getPriceInterval)
            clearInterval(this.getPriceInterval);
        this.getPriceInterval = setInterval(() => {
            this.refreshPrice();
            this.resetData();
        }, this.refreshTime)
    }

    refreshPrice() {
        this.listData.forEach((item, index) => {
            $http.get({
                url: this.klineApi(item.currency.text.toLowerCase()),
                handler: (res) => {
                    let kline = res.data && res.data.data;
                    let a = (kline[0].close - kline[0].open) / kline[0].open * 100;
                    item.price.text = kline[0].close.toFixed(item.pricePrecision);
                }
            });
        });
    }

    renderCurrencys() {
        this.listData = [];
        let favoriteList = [];
        let mainList = [];
        let inovationList = [];
        let currencys = [];
        let menuIndex = $('menu').index;

        this.currencyList.forEach(item => {
            if (item.favorite)
                favoriteList.push(item);
            if (item['symbol-partition'] === 'main')
                mainList.push(item);
            else
                inovationList.push(item);
        })
        switch(menuIndex) {
            case 0:
                currencys = favoriteList;
                break;
            case 1:
                currencys = mainList;
                break;
            case 2:
                currencys = inovationList;
                break;
            default:
                currencys = mainList;
                break;
        }
        currencys.forEach(item => {
            this.listData.push({
                isFavorite: {
                    title: item.favorite ? '⭐' : '☆',
                },
                currency: {
                    text: item['base-currency'].toUpperCase(),
                },
                price: {
                    text: '0',
                },
                range: {
                    text: '0%',
                },
                pricePrecision: item['price-precision'],
            });
        });

        this.resetData();
    }

    resetData() {
        $('list').data = this.listData;
        $("list").endRefreshing();
    }

    toggleFavorite(currency) {
        this.currencyList = this.currencyList.map((item) => {
            if (item['base-currency'] === currency.toLowerCase()) item.favorite = !item.favorite;
            return item;
        });
        $cache.set('currencyList', this.currencyList);
        this.listData.map(item => {
            console.log(item.currency.text === currency , currency);
            if (item.currency.text === currency)
                item.isFavorite.title = item.isFavorite.title === '☆' ? '⭐' : '☆'
            return item;
        })
    }

    render() {
        $ui.render({
            views: [
                {
                    type: "list",
                    props: {
                        id: "list",
                        rowHeight: 50,
                        separatorColor: $color('gray'),
                        template: [
                            {
                                type: 'label',
                                props: {
                                    id: 'bgColor',
                                    bgcolor: $color(this.bgColor),
                                },
                                layout: function(make, view) {
                                    make.left.equalTo(0);
                                    make.top.equalTo(0);
                                    make.height.equalTo(view.super);
                                    make.width.equalTo(view.super);
                                },
                            },
                            {
                                type: 'button',
                                props: {
                                    id: 'isFavorite',
                                    titleColor: $color('#fff'),
                                    bgcolor: $color(this.bgColor),
                                },
                                layout: function(make, view) {
                                    make.left.equalTo(0)
                                    make.top.equalTo(0)
                                    make.height.equalTo(view.super);
                                    make.width.equalTo(50);
                                },
                                events: {
                                    tapped: (e) => {
                                        e.title = e.title === '☆' ? '⭐' : '☆'
                                        this.toggleFavorite(e.next.text);
                                    }
                                }
                            },
                            {
                                type: 'label',
                                props: {
                                    id: 'currency',
                                    textColor: $color('#fff'),
                                },
                                layout: function(make, view) {
                                    make.left.equalTo(50)
                                    make.top.equalTo(0)
                                    make.height.equalTo(view.super);
                                    make.width.equalTo(60);
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    id: 'price',
                                    textColor: $color('#fff'),
                                    align: $align.center,
                                },
                                layout: function(make, view) {
                                    make.left.equalTo(0)
                                    make.top.equalTo(0)
                                    make.height.equalTo(view.super);
                                    make.width.equalTo(view.super);
                                    make.center.equalTo(view.super)
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    id: 'range',
                                    textColor: $color('#fff'),
                                    align: $align.right,
                                },
                                layout: function(make, view) {
                                    make.right.equalTo(-20)
                                    make.top.equalTo(0)
                                    make.height.equalTo(view.super);
                                    make.width.equalTo(100);
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    id: 'raiseRange',
                                    textColor: $color(this.raiseColor),
                                    align: $align.right,
                                },
                                layout: function(make, view) {
                                    make.right.equalTo(-20)
                                    make.top.equalTo(0)
                                    make.height.equalTo(view.super);
                                    make.width.equalTo(100);
                                },
                            },
                            {
                                type: 'label',
                                props: {
                                    id: 'fallRange',
                                    textColor: $color(this.fallColor),
                                    align: $align.right,
                                },
                                layout: function(make, view) {
                                    make.right.equalTo(-20)
                                    make.top.equalTo(0)
                                    make.height.equalTo(view.super);
                                    make.width.equalTo(100);
                                },
                            },
                            
                        ],
                        data: [],
                    },
                    layout: (make, view) => {
                        make.left.right.equalTo(0)
                        make.top.equalTo(44)
                        make.height.equalTo(view.super).offset(-44)
                    },
                },
                {
                    type: "menu",
                    props: {
                        items: ["收藏", "主区", "创新区"]
                    },
                    layout: make => {
                        make.left.top.right.equalTo(0)
                        make.height.equalTo(44)
                    },
                    events: {
                        changed: (sender) => {
                            var items = sender.items
                            var index = sender.index
                            $ui.toast(index + ": " + items[index])
                            this.renderCurrencys();
                        },
                    },
                },
            ],
        });
    }
}

new Huobi();
