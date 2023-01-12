/* Game Controller Debounce */
function debounce(func, delay) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, arguments);
    }, delay)
  };
}

let scheduledUp = false
let scheduledDown = false

/* Game Pad Listeners*/
gameControl
  .on('connect', gamepad => {
    gamepad.on('up', () => {
      if (!scheduledUp) {
        scheduledUp = true
        setTimeout(() => {
          requestAnimationFrame(() => {
            highlightPreviousListItem()
            scheduledUp = false
          });
        }, 150);
      }
    })
    gamepad.on('down', () => {
      if (!scheduledDown) {
        scheduledDown = true
        setTimeout(() => {
          requestAnimationFrame(() => {
            highlightNextListItem()
            scheduledDown = false
          });
        }, 150);
      }
    })
    gamepad.on('left', () => {
    })
    gamepad.on('right', () => {
    })
    gamepad.on('start', () => {
      debouncedFullscreen()
    })
    gamepad.on('select', () => {
      console.log('testing select')
    })
    gamepad.on('l1', () => {
    })
    gamepad.on('r1', () => {
    })
    gamepad.on('button0', () => {
      console.log('Selecting an item')
      debouncedSelect()
    })
    gamepad.on('button1', () => {
      console.log('Menu was toggled')
      debouncedToggleMenu()
    })
    gamepad.on('button2', () => {
    })
    gamepad.on('button3', () => {
    })
  })
  .on('beforeCycle', () => {
    // document.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
  });

let debouncedToggleMenu = debounce(toggleMenu, 250)
let debouncedSelect = debounce(triggerSelected, 250)
let debouncedFullscreen = debounce(toggleFullscreen, 250)

// Keep track of the currently selected channel
let selectedIndex = 0

// Get a reference to the channel list elements
let ul = document.getElementById("channel_list-elements")
let li = ul.getElementsByTagName('li')

// Function to navigate up through the channel list
function navigateUp() {
  // Deselect the current channel
  li[selectedIndex].classList.remove('selected')

  // Decrement the selected index
  selectedIndex--;

  // If the selected index is negative, wrap around to the end of the list
  if (selectedIndex < 0) {
    selectedIndex = li.length - 1
  }

  // Select the new channel
  li[selectedIndex].classList.add('selected')
}

// Function to navigate down through the channel list
function navigateDown() {
  // Deselect the current channel
  li[selectedIndex].classList.remove('selected')

  // Increment the selected index
  selectedIndex++

  // If the selected index is greater than the length of the list, wrap around to the beginning of the list
  if (selectedIndex >= li.length) {
    selectedIndex = 0
  }

  // Select the new channel
  li[selectedIndex].classList.add('selected');
}

function highlightPreviousListItem() {
  // Get a reference to the channel list elements
  let listElements = document.getElementsByClassName("channel_list-element");

  // Find the currently highlighted element
  let currentIndex = -1
  for (let i = 0; i < listElements.length; i++) {
    if (listElements[i].classList.contains("highlighted")) {
      currentIndex = i
      break;
    }
  }

  // Deselect the current element
  if (currentIndex > -1) {
    listElements[currentIndex].classList.remove("highlighted");
  }

  // Select the previous element, or the last element if at the beginning of the list
  currentIndex--
  if (currentIndex < 0) {
    currentIndex = listElements.length - 1;
  }
  listElements[currentIndex].classList.add("highlighted");

  // Scroll the list if necessary
  if (currentIndex > -1) {
    let element = listElements[currentIndex - 1]
    if (element) {
      let elementRect = element.getBoundingClientRect();
      let absoluteElementTop = elementRect.top + window.pageYOffset;
      let middle = absoluteElementTop - (window.innerHeight / 2)
      // if (elementRect.top < 0) {
      //   document.getElementById("channel_list").scrollTo(0, middle);
      // }
      // check if the element is above or below the middle of the viewport
      if (absoluteElementTop > middle) {
        // element is above the middle of the viewport
        document.getElementById("channel_list").scrollTo({ top: element.offsetTop, behavior: 'smooth' })
      } else {
        // element is below the middle of the viewport
        document.getElementById("channel_list").scrollTo({ top: element.offsetTop - (window.innerHeight / 2) + element.offsetHeight, behavior: 'smooth' })
      }
    }
  }
}

function highlightNextListItem() {
  // Highlight the next list item in the channel list
  // Get a reference to the channel list elements
  let listElements = document.getElementsByClassName("channel_list-element")

  // Find the currently highlighted element
  let currentIndex = -1
  for (let i = 0; i < listElements.length; i++) {
    if (listElements[i].classList.contains("highlighted")) {
      currentIndex = i
      break
    }
  }

  // Deselect the current element
  if (currentIndex > -1) {
    listElements[currentIndex].classList.remove("highlighted");
  }

  // Select the next element, or the first element if at the end of the list
  currentIndex++;
  if (currentIndex >= listElements.length) {
    currentIndex = 0
  }
  listElements[currentIndex].classList.add("highlighted")

  // Scroll the list if necessary
  if (currentIndex > -1) {
    let element = listElements[currentIndex]
    if (element) {
      let elementRect = element.getBoundingClientRect()
      let absoluteElementTop = elementRect.top + window.pageYOffset;
      let middle = absoluteElementTop - (window.innerHeight / 2);

      // check if the element is above or below the middle of the viewport
      if (absoluteElementTop < middle) {
        // element is above the middle of the viewport
        document.getElementById("channel_list").scrollTo({ top: element.offsetTop, behavior: 'smooth' })
      } else {
        // element is below the middle of the viewport
        document.getElementById("channel_list").scrollTo({ top: element.offsetTop - (window.innerHeight / 2) + element.offsetHeight, behavior: 'smooth' })
      }
    }
  }
}

// Triggers the selected channel
function triggerSelected() {
  // Find the currently highlighted element
  let listElements = document.getElementsByClassName("channel_list-element")
  let currentIndex = -1
  for (let i = 0; i < listElements.length; i++) {
    if (listElements[i].classList.contains("highlighted")) {
      currentIndex = i
      break
    }
  }

  // Trigger a click event on the selected element
  if (currentIndex > -1) {
    let a = li[currentIndex].getElementsByTagName("a")[selectedIndex];
    // Update the overlay title
    document.getElementById("overlay-title").innerHTML = a.textContent
    // Show the overlay
    document.getElementById("overlay").style.display = "block"
    // Hide the overlay after x seconds
    setTimeout(function () {
      document.getElementById("overlay").style.display = "none"
    }, 30000)

    // Trigger the click event on the link element
    a.click()
  }
}
