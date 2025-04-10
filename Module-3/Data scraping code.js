// 全局变量存储图表实例
let planningChart = null
let areaChart = null
let restaurantChart = null
let barChart = null

// 初始化地图
const map = L.map('map').setView([51.5074, -0.1278], 12)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map)

// 生成热力点数据
const heatData = []
for (let i = 0; i < 200; i++) {
  const lat = 51.5074 + (Math.random() - 0.5) * 0.4
  const lng = -0.1278 + (Math.random() - 0.5) * 0.4
  const intensity = Math.random()
  heatData.push([lat, lng, intensity])
}

console.log(heatData)
// 添加热力图层
const heatLayer = L.heatLayer(heatData, {
  radius: 30,
  blur: 20,
  maxZoom: 10,
  max: 1.0,
  gradient: {
    0.4: 'blue',
    0.6: 'lime',
    0.8: 'yellow',
    1.0: 'red',
  },
}).addTo(map)

// 调整地图缩放级别
map.setZoom(11)

// 初始化图表函数
function initChart(elementId) {
  const dom = document.getElementById(elementId)
  if (!dom) {
    console.error(`Element ${elementId} not found`)
    return null
  }
  try {
    const chart = echarts.init(dom)
    return chart
  } catch (error) {
    console.error(`Failed to initialize chart ${elementId}:`, error)
    return null
  }
}

// 安全的图表设置选项函数
function safeSetOption(chart, option) {
  if (chart && chart.setOption) {
    try {
      chart.setOption(option)
    } catch (error) {
      console.error('Failed to set chart option:', error)
    }
  }
}

// 获取规划数据并更新图表
async function fetchPlanningData() {
  try {
    if (!planningChart) {
      planningChart = initChart('populationChart')
    }
    if (!planningChart) return

    const response = await fetch(
      'https://api.propertydata.co.uk/planning?key=PVA1JQDVLC&postcode=NW6+7YD&decision_rating=positive&category=EXTENSION,LOFT%20CONVERSION&max_age_update=120&results=20'
    )
    const data = await response.json()

    // 处理规划数据
    const planningData = data.data || []
    console.log('Planning Data:', planningData) // 调试用

    // 按月份统计规划申请数量
    const planningByMonth = {}
    planningData.forEach((item) => {
      // 确保日期字段存在
      if (item.date_received) {
        const date = new Date(item.date_received)
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`
        planningByMonth[monthYear] = (planningByMonth[monthYear] || 0) + 1
      }
    })

    // 如果没有数据，添加一些模拟数据
    if (Object.keys(planningByMonth).length === 0) {
      const currentDate = new Date()
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate)
        date.setMonth(date.getMonth() - i)
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`
        planningByMonth[monthYear] = Math.floor(Math.random() * 10) + 1
      }
    }

    // 转换为数组并排序
    const monthData = Object.entries(planningByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // 只显示最近12个月

    console.log('Processed Data:', monthData) // 调试用

    safeSetOption(planningChart, {
      title: {
        text: 'Planning Application Trends',
        textStyle: {
          color: '#ffffff',
          fontSize: 14,
          fontFamily: 'Arial',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: '{b}<br/>Applications: {c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: monthData.map(([month]) => month),
        axisLabel: {
          color: '#ffffff',
          rotate: 45,
          fontSize: 10,
          fontFamily: 'Arial',
        },
      },
      yAxis: {
        type: 'value',
        name: 'Number',
        nameTextStyle: {
          color: '#ffffff',
          fontSize: 12,
          fontFamily: 'Arial',
        },
        axisLabel: {
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'Arial',
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
      series: [
        {
          name: 'Planning Applications',
          type: 'bar',
          data: monthData.map(([, count]) => count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: '#00ff9d' },
                { offset: 0.7, color: '#188df0' },
                { offset: 1, color: '#188df0' },
              ]),
            },
          },
          barWidth: '60%',
          label: {
            show: true,
            position: 'top',
            color: '#ffffff',
            fontSize: 10,
            fontFamily: 'Arial',
          },
        },
      ],
      backgroundColor: 'transparent',
    })
  } catch (error) {
    console.error('Failed to fetch planning data:', error)
  }
}

// 调用函数获取数据
fetchPlanningData()

// 获取学校数据并更新饼图
async function fetchSchoolData() {
  try {
    if (!areaChart) {
      areaChart = initChart('areaChart')
    }
    if (!areaChart) return

    const response = await fetch(
      'https://api.propertydata.co.uk/schools?key=PVA1JQDVLC&postcode=W21TR'
    )
    const data = await response.json()

    // 过滤掉num_pupils为undefined的数据
    const schoolData = data.data.state.nearest
      .filter((item) => item.num_pupils)
      .sort((a, b) => b.num_pupils - a.num_pupils)

    safeSetOption(areaChart, {
      title: {
        text: 'Student Distribution in London Schools',
        textStyle: {
          color: '#ffffff',
          fontSize: 14,
          fontFamily: 'Arial',
        },
        left: 'center',
        top: 10,
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>Students: {c}<br/>Percentage: {d}%',
      },
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 1,
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{d}%',
            color: '#ffffff',
            fontSize: 10,
            fontFamily: 'Arial',
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 10,
            lineStyle: {
              color: '#ffffff',
            },
          },
          data: schoolData.map((school) => ({
            name: school.name,
            value: school.num_pupils,
          })),
        },
      ],
      backgroundColor: 'transparent',
    })
  } catch (error) {
    console.error('Failed to fetch school data:', error)
  }
}

// 调用函数获取数据
fetchSchoolData()

// 获取犯罪数据并更新柱状图
async function fetchCrimeData() {
  try {
    if (!barChart) {
      barChart = initChart('barChart')
    }
    if (!barChart) return

    const response = await fetch(
      'https://api.propertydata.co.uk/crime?key=PVA1JQDVLC&postcode=W14+9JH'
    )
    const data = await response.json()
    // 更新普通柱状图
    const crimeTypes = Object.keys(data.types)
    const crimeValues = Object.values(data.types)

    safeSetOption(barChart, {
      title: {
        text: 'London Crime Statistics by Type',
        textStyle: {
          color: '#ffffff',
          fontSize: 14,
          fontFamily: 'Arial',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'Arial',
        },
      },
      yAxis: {
        type: 'category',
        data: crimeTypes,
        axisLabel: {
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'Arial',
          width: 100,
          overflow: 'break',
        },
      },
      series: [
        {
          name: 'Number of Cases',
          type: 'bar',
          data: crimeValues,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                { offset: 0, color: '#00ff9d' },
                { offset: 0.7, color: '#188df0' },
                { offset: 1, color: '#188df0' },
              ]),
            },
          },
        },
      ],
      backgroundColor: 'transparent',
    })
  } catch (error) {
    console.error('Failed to fetch crime data:', error)
  }
}

// 调用函数获取数据
fetchCrimeData()

// 获取餐厅数据并更新折线图
async function fetchRestaurantData() {
  try {
    if (!restaurantChart) {
      restaurantChart = initChart('barChart3D')
    }
    if (!restaurantChart) return

    const response = await fetch(
      'https://api.propertydata.co.uk/restaurants?key=PVA1JQDVLC&postcode=OX73EX'
    )
    const data = await response.json()

    // 过滤掉hygiene为null的数据，并按hygiene评分排序
    const restaurantData = data.data.nearby
      .filter((item) => item.hygiene !== null)
      .sort((a, b) => b.hygiene - a.hygiene)

    // 获取餐厅名称和卫生评分
    const restaurantNames = restaurantData.map((item) => item.name)
    const hygieneScores = restaurantData.map((item) => item.hygiene)

    safeSetOption(restaurantChart, {
      title: {
        text: 'Restaurant Hygiene Score Distribution',
        textStyle: {
          color: '#ffffff',
          fontSize: 14,
          fontFamily: 'Arial',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: function (params) {
          const data = params[0]
          return `${data.name}<br/>Hygiene Score: ${data.value}`
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: restaurantNames,
        axisLabel: {
          color: '#ffffff',
          interval: 0,
          rotate: 45,
          fontSize: 10,
          fontFamily: 'Arial',
          width: 100,
          overflow: 'break',
        },
      },
      yAxis: {
        type: 'value',
        name: 'Hygiene',
        nameTextStyle: {
          color: '#ffffff',
          fontSize: 12,
          fontFamily: 'Arial',
        },
        axisLabel: {
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'Arial',
        },
        min: 0,
        max: 5,
      },
      series: [
        {
          name: 'Hygiene',
          type: 'line',
          data: hygieneScores,
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: {
            color: '#00ff9d',
            width: 3,
          },
          itemStyle: {
            color: '#00ff9d',
            borderWidth: 2,
            borderColor: '#fff',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 255, 157, 0.3)' },
              { offset: 1, color: 'rgba(0, 255, 157, 0.1)' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: '#fff',
              borderColor: '#00ff9d',
              borderWidth: 3,
              shadowColor: 'rgba(0, 255, 157, 0.5)',
              shadowBlur: 10,
            },
          },
        },
      ],
      backgroundColor: 'transparent',
    })
  } catch (error) {
    console.error('Failed to fetch restaurant data:', error)
  }
}

// 调用函数获取数据
fetchRestaurantData()

// 修改resize事件处理
window.addEventListener('resize', () => {
  if (planningChart) planningChart.resize()
  if (areaChart) areaChart.resize()
  if (restaurantChart) restaurantChart.resize()
  if (barChart) barChart.resize()
  if (map) map.invalidateSize()
})

// 确保DOM加载完成后再初始化
document.addEventListener('DOMContentLoaded', function () {
  // 调用数据获取函数
  fetchPlanningData()
  fetchSchoolData()
  fetchCrimeData()
  fetchRestaurantData()

  // 处理窗口大小改变
  window.addEventListener('resize', () => {
    if (planningChart) planningChart.resize()
    if (areaChart) areaChart.resize()
    if (restaurantChart) restaurantChart.resize()
    if (barChart) barChart.resize()
    if (map) map.invalidateSize()
  })
})

// 定期刷新数据
setInterval(() => {
  fetchPlanningData()
  fetchSchoolData()
  fetchCrimeData()
  fetchRestaurantData()
}, 300000) // 每5分钟刷新一次数据
