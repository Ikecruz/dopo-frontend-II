var app = new Vue({
    el: "#app",
    data: {
        activities: [],
        sortByProperty: "title",
        sortOrder: "ascending",
        searchKeyword: "",
        cart: [],
        viewActivities: true,
        checkout: {
            fullname: "",
            mobile: ""
        }
    },
    methods: {
        getActivities: async function () {
            try {
                
                const data = await fetch("http://dopo-api.eu-west-2.elasticbeanstalk.com/activities");
                this.activities = await data.json()

            } catch (error) {
                console.log(error)
            }
        },
        /* Sorts the `activities` array based on the `sortByProperty`(title, location, price, space) 
        and `sortOrder`(ascending, decending) data properties. */
        sortActivities: function (activities, order) {
            return activities.sort((a, b) => {
                let aRefined = a[this.sortByProperty], bRefined = b[this.sortByProperty];

                if (typeof a[this.sortByProperty] === "string") {
                    aRefined = a[this.sortByProperty].toLowerCase();
                    bRefined = b[this.sortByProperty].toLowerCase();
                }

                return order === "ascending" ? aRefined > bRefined :  aRefined < bRefined;
            })
        },
        /* Responsible for filtering the `activities` based on the `searchKeyword`. */
        searchActivities: async function () {
            try {
                
                const response = await fetch(`http://dopo-api.eu-west-2.elasticbeanstalk.com/activities/search?q=${this.searchKeyword}`)
                this.activities = await response.json()

            } catch (error) {
                console.log(error)
            }
        },
        /* Responsible for adding an activity to the cart. */
        addToCart: function (activity) {
            let itemInCart = this.cart.find(item => item._id === activity._id);

            if (!itemInCart) {
                let newItemInCart = {
                    ...activity,
                    bookedSpaces: 0
                }

                this.cart.push(newItemInCart);
            }

            this.activities = this.activities.map(item => {
                if (item._id === activity._id) return {...item, spaces: item.spaces - 1}
                return item
            });

            this.cart = this.cart.map(item => {
                if (item._id === activity._id) return {
                    ...item, 
                    spaces: item.spaces - 1,
                    bookedSpaces: item.bookedSpaces + 1
                }
                return item
            });

        },
        removeFromCart: function (activity) {
            const cartWithOutRemovedActivity = this.cart.filter(item => item._id !== activity._id);

            this.cart = this.cart.map(item => {
                if (item._id === activity._id) {
                    return {
                        ...item,
                        bookedSpaces: item.bookedSpaces - 1,
                        spaces: item.spaces + 1
                    }
                }
                return item;
            })

            this.activities = this.activities.map(item => {
                if (item._id === activity._id) {
                    return {
                        ...item,
                        spaces: item.spaces + 1
                    }
                }

                return item;
            })

            if (activity.bookedSpaces <= 1) this.cart = cartWithOutRemovedActivity;
            if (this.cart.length === 0) this.viewActivities = true;

        },
        changePage: function () {
            this.viewActivities = !this.viewActivities;
        },
        acceptJustNumbers: function (event) {
            if (!/^[0-9+]+$/.test(event.key)) event.preventDefault();
        },
        acceptJustLetters: function (event) {
            if (!/^[a-zA-Z]+$/.test(event.key)) event.preventDefault();
        },
        finish: async function () {
            const order = {
                name: this.checkout.fullname,
                phoneNumber: this.checkout.mobile,
                items: this.cart
            }
            
            try {
                
                await fetch("http://dopo-api.eu-west-2.elasticbeanstalk.com/orders", {
                    method: "POST",
                    body: JSON.stringify(order),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                })

                await this.updateStock()

                alert("Order completed")

            } catch (error) {
                console.log(error)
            }
        },
        updateStock: async function () {
            try {
                
                await fetch("http://dopo-api.eu-west-2.elasticbeanstalk.com/activities", {
                    method: "PUT",
                    body: JSON.stringify(this.cart),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                })

            } catch (error) {
                console.log(error)
            }
        }
    },
    computed: {
        filteredActivities: function () {
            return this.sortActivities(
                this.activities,
                this.sortOrder
            );
        },
        /* Checks if an activity can be added to cart. It returns a function that takes an `id` parameter. */
        disableAddToCart: function () {
            return (id) => {
                const item = this.activities.find(item => item._id === id)
                if (item.spaces > 0) return false;
                return true
            }
        },
        totalPrice: function () {
            return this.cart.reduce((previousValue, currentValue) => {
                return previousValue + (currentValue.price * currentValue.bookedSpaces)
            }, 0)
        },
        validateForm: function () {
            return (this.checkout.fullname.length < 1 || this.checkout.mobile.length < 5)
        },
        cartLength: function () {
            return this.cart.length;
        }
    },
    created() {
        this.getActivities();
    }
})