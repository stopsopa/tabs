const log = console.log;

const vanilaTabs = (function () {
  const warn = (function () {
    try {
      return (...args) => console.warn("vanilla-tabs:", ...args);
    } catch (e) {
      return () => {};
    }
  })();

  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  function isPlainObject(value) {
    // simplified version of isPlainObject then the one in lodash
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function isNode(value) {
    return isObjectLike(value) && !isPlainObject(value);
  }

  let bound = false;
  return {
    active: function () {
      Array.from(
        document.querySelectorAll("[data-vanila-tabs] > [data-buttons]")
      )
        .map((parent) => parent.querySelector(":scope > .active"))
        .filter(Boolean)
        .forEach((target) => {
          this.activeByButtonElement(target.parentNode.parentNode, target);
        });
    },
    activeByButtonElement: function (parent, target, extra) {
      if (!isNode(parent)) {
        warn(`parent argument is not valid DOM element`, parent);

        return this;
      }

      if (!isNode(target)) {
        warn(`target argument is not valid DOM element`, parent, target);

        return this;
      }

      let { buttons } = { ...extra };

      if (!buttons) {
        buttons = Array.from(parent.querySelector("[data-buttons]").children);
      }

      const zeroIndex = buttons.indexOf(target);

      return this.activeByIndex(parent, zeroIndex, { buttons });
    },
    activeByIndex: function (parent, zeroIndex, extra) {
      if (!isNode(parent)) {
        warn(`parent argument is not valid DOM element`, parent);

        return this;
      }

      let { buttons, divs } = { ...extra };

      if (!buttons) {
        buttons = Array.from(parent.querySelector("[data-buttons]").children);
      }

      if (buttons.length === 0) {
        warn(`buttons not found`, parent);

        return this;
      }

      if (!divs) {
        divs = Array.from(parent.querySelector("[data-tabs]").children);
      }

      if (divs.length === 0) {
        warn(`divs not found`, parent);

        return this;
      }

      if (buttons.length !== divs.length) {
        warn(`buttons and divs length mismatch`, parent);

        return this;
      }

      if (
        !(
          Number.isInteger(zeroIndex) &&
          !Number.isNaN(zeroIndex) &&
          zeroIndex > -1
        )
      ) {
        warn(`zeroIndex not found`, zeroIndex, parent, target);

        return this;
      }

      buttons.forEach(function (button, i) {
        if (i === zeroIndex) {
          button.classList.add("active");
          divs[i].classList.add("active");
        } else {
          button.classList.remove("active");
          divs[i].classList.remove("active");
        }
      });

      return this;
    },
    bind: function () {
      if (bound) {
        warn(`already bound`);

        return this;
      }

      bound = true;

      const event = (e) => {
        var target = e.target;

        var match = target.matches("[data-vanila-tabs] > [data-buttons] > *");

        if (match) {
          const parent = target.parentNode.parentNode;

          const buttons = Array.from(
            parent.querySelector("[data-buttons]").children
          );

          const zeroIndex = buttons.indexOf(target);

          this.activeByIndex(parent, zeroIndex, { buttons });
        }
      };

      document.body.addEventListener("click", event);

      return () => {
        document.body.removeEventListener("click", event);
      };
    },
  };
})();
