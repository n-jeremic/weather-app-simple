const apiKey = '22499a2db07fe90d36fd48a0729fc39a'
const state = {
  currentCity: null,
  currentNumOfDays: 1
}
let intervalId = null

document.querySelector('form').addEventListener('submit', async event => {
  event.preventDefault()

  const numOfDays = parseInt($('#numOfDaysInput').val())
  const cityName = $('#cityInput').val()
  state.currentNumOfDays = numOfDays
  state.currentCity = cityName

  $('#weatherInfoCard').hide()
  const forecastData = await getForecastData()
  if (forecastData) {
    renderForecastDOM(forecastData)
  }
})

async function getForecastData() {
  const cityName = state.currentCity

  try {
    const currentWeatherData = await handlePromise(getCurrentWeatherInfo(cityName))
    const completeWeatherData = await handlePromise(getCompleteWeatherInfo(currentWeatherData.coord))
    completeWeatherData.city = currentWeatherData.name
    
    console.log(completeWeatherData)
  
    setRefreshForecastInterval()
    return completeWeatherData
  } catch(err) {
    console.log(err.message, "error caught")
    $('#errorMessage').text(err.message.toUpperCase() + '.')
    $('#errorMessage').show()
    if (intervalId) {
      window.clearTimeout(intervalId);
    }
    state.currentCity = null
    state.currentNumOfDays = 1
  }

}

const fetchAndRenderForecast = async () => {
  const forecastData = await getForecastData()
  
  if (forecastData) {
    renderForecastDOM(forecastData)
  }
}

function setRefreshForecastInterval() {
  if (intervalId) {
    window.clearTimeout(intervalId)
    intervalId = null
  } 

  intervalId = window.setTimeout(fetchAndRenderForecast, 2000)
}

function renderForecastDOM(data) {
  $('#errorMessage').css('display', 'none')

  const currentWeatherObj = data.current
  $('#cityName').text(data.city)
  $('#currentWeatherImg').attr('src', `http://openweathermap.org/img/wn/${currentWeatherObj.weather[0].icon}@2x.png`)
  $('#currentWeatherDescription').text(`(${currentWeatherObj.weather[0].main})`)
  $('#currTempField').val(`${formatTempNumber(currentWeatherObj.temp)} C`)
  $('#currHumidityField').val(`${currentWeatherObj.humidity} %`)
  $('#currPressureField').val(`${currentWeatherObj.pressure} mbar`)
  $('#currWindField').val(`${currentWeatherObj.wind_speed} km/h`)
  $('#currentDay').text(getDayOfTheWeek(new Date().getDay()))
  
  const isLiked = checkCityInFavourites()
  if (isLiked) {
    $('#removeFromFavouritesBtn').show()
    $('#addToFavouritesBtn').hide()
  } else {
    $('#removeFromFavouritesBtn').hide()
    $('#addToFavouritesBtn').show()
  }

  const numOfDays = state.currentNumOfDays
  if (numOfDays > 1) {
    generateForecastTable(data.daily, numOfDays)
  } else {
    $('#forecastTable').hide()
  }

  $('#weatherInfoCard').show()
}

function generateForecastTable(daysArray, numOfDays) {
  let numOfDaysString
  if (numOfDays > 2) {
    numOfDaysString = `Next ${numOfDays - 1} days`
  } else {
    numOfDaysString = `Next day`
  }
  $('#numOfDaysSelected').text(numOfDaysString)

  $('#tableBody').empty()
  let rows = ''
  const currentDayInt = new Date().getDay()
  for (let i = 0; i < numOfDays - 1; i++) {
    const currentWeatherObj = daysArray[i]
    rows += `<tr>
      <th scope="row">${getDayOfTheWeek(currentDayInt + 1 + i)}</th>
      <td><img width="30px" src="http://openweathermap.org/img/wn/${currentWeatherObj.weather[0].icon}@2x.png">${currentWeatherObj.weather[0].description}</td>
      <td>${formatTempNumber(currentWeatherObj.temp.day)} C</td>
      <td>${currentWeatherObj.humidity} %</td>
      <td>${currentWeatherObj.pressure} mbar</td>
      <td>${currentWeatherObj.wind_speed} km/h</td>
    </tr>`
  }

  $('#tableBody').html(rows)
  $('#forecastTable').show()
}

async function handlePromise(promise) {
  const response = await promise
  const jsonFormat = await response.json()

  if (response.status === 200) {
    return jsonFormat
  } else {
    throw new Error(jsonFormat.message)
  }
}

function getCurrentWeatherInfo(cityName) {
  return fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`)
}

function getCompleteWeatherInfo({ lat, lon }) {
  return fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&
  exclude=minutely,hourly&appid=${apiKey}`)
}

function checkCityInFavourites() {
  const ls = localStorage.getItem('favouriteCities')
  if (!ls) {
    return false
  }

  const lsParsed = JSON.parse(ls)
  const cityName = state.currentCity.toLowerCase()

  if (lsParsed.includes(cityName)) {
    return true
  } else {
    return false
  }
}

function autofillCityInput(cityName) {
  if (cityName !== 'null') {
    $('#cityInput').val(cityName)
  }
}

function checkFavouriteCities() {
  const ls = localStorage.getItem('favouriteCities')
  $('#favCities').empty()

  if (ls) {
    const lsParsed = JSON.parse(ls)
    let options = '<option value="null">Not selected</option>'
    lsParsed.forEach(city => {
      const cityName = city[0].toUpperCase() + city.slice(1)
      options += `<option value="${cityName}">${cityName}</option>`
    })
    $('#favCities').html(options)
  } else {
    $('#favCities').html('<option value="null">No favourite cities yet</option>')
  }
}

function addToFavourites() {
  const ls = localStorage.getItem('favouriteCities')
  const cityName = state.currentCity.toLowerCase()
  if (ls) {
    const lsParsed = JSON.parse(ls)
    lsParsed.push(cityName)
    localStorage.setItem('favouriteCities', JSON.stringify(lsParsed))
  } else {
    localStorage.setItem('favouriteCities', JSON.stringify([cityName]))
  }

  $('#removeFromFavouritesBtn').show()
  $('#addToFavouritesBtn').hide()
  checkFavouriteCities()
}

function removeFromFavourites() {
  const cityName = state.currentCity.toLowerCase()
  const lsParsed = JSON.parse(localStorage.getItem('favouriteCities'))

  const index = lsParsed.findIndex(city => city === cityName)
  lsParsed.splice(index, 1)

  if (lsParsed.length) {
    localStorage.setItem('favouriteCities', JSON.stringify(lsParsed))
  } else {
    localStorage.removeItem('favouriteCities')
  }

  $('#removeFromFavouritesBtn').hide()
  $('#addToFavouritesBtn').show()
  checkFavouriteCities()
}

function formatTempNumber(number) {
  return Math.round(number / 10)
}

function getDayOfTheWeek(dayInt) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const numOfDays = days.length

  if (dayInt > numOfDays - 1) return days[dayInt - numOfDays]
  else return days[dayInt]
}