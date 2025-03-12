/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/deepmerge/dist/cjs.js
var require_cjs = __commonJS({
  "node_modules/deepmerge/dist/cjs.js"(exports, module2) {
    "use strict";
    var isMergeableObject = function isMergeableObject2(value) {
      return isNonNullObject(value) && !isSpecial(value);
    };
    function isNonNullObject(value) {
      return !!value && typeof value === "object";
    }
    function isSpecial(value) {
      var stringValue = Object.prototype.toString.call(value);
      return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
    }
    var canUseSymbol = typeof Symbol === "function" && Symbol.for;
    var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
    function isReactElement(value) {
      return value.$$typeof === REACT_ELEMENT_TYPE;
    }
    function emptyTarget(val) {
      return Array.isArray(val) ? [] : {};
    }
    function cloneUnlessOtherwiseSpecified(value, options) {
      return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
    }
    function defaultArrayMerge(target, source, options) {
      return target.concat(source).map(function(element) {
        return cloneUnlessOtherwiseSpecified(element, options);
      });
    }
    function getMergeFunction(key, options) {
      if (!options.customMerge) {
        return deepmerge;
      }
      var customMerge = options.customMerge(key);
      return typeof customMerge === "function" ? customMerge : deepmerge;
    }
    function getEnumerableOwnPropertySymbols(target) {
      return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
        return Object.propertyIsEnumerable.call(target, symbol);
      }) : [];
    }
    function getKeys(target) {
      return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
    }
    function propertyIsOnObject(object, property) {
      try {
        return property in object;
      } catch (_) {
        return false;
      }
    }
    function propertyIsUnsafe(target, key) {
      return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
    }
    function mergeObject(target, source, options) {
      var destination = {};
      if (options.isMergeableObject(target)) {
        getKeys(target).forEach(function(key) {
          destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
        });
      }
      getKeys(source).forEach(function(key) {
        if (propertyIsUnsafe(target, key)) {
          return;
        }
        if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
          destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
        } else {
          destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
        }
      });
      return destination;
    }
    function deepmerge(target, source, options) {
      options = options || {};
      options.arrayMerge = options.arrayMerge || defaultArrayMerge;
      options.isMergeableObject = options.isMergeableObject || isMergeableObject;
      options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
      var sourceIsArray = Array.isArray(source);
      var targetIsArray = Array.isArray(target);
      var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
      if (!sourceAndTargetTypesMatch) {
        return cloneUnlessOtherwiseSpecified(source, options);
      } else if (sourceIsArray) {
        return options.arrayMerge(target, source, options);
      } else {
        return mergeObject(target, source, options);
      }
    }
    deepmerge.all = function deepmergeAll(array, options) {
      if (!Array.isArray(array)) {
        throw new Error("first argument should be an array");
      }
      return array.reduce(function(prev, next) {
        return deepmerge(prev, next, options);
      }, {});
    };
    var deepmerge_1 = deepmerge;
    module2.exports = deepmerge_1;
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GeocodingPlugin
});
module.exports = __toCommonJS(main_exports);
var import_deepmerge = __toESM(require_cjs());
var import_obsidian6 = require("obsidian");

// src/search-modal.ts
var import_obsidian2 = require("obsidian");

// src/results-modal.ts
var import_obsidian = require("obsidian");
var GeocodingResultsModal = class extends import_obsidian.SuggestModal {
  constructor(plugin, results) {
    super(plugin.app);
    this.plugin = plugin;
    this.results = results;
    this.setPlaceholder("Select result");
  }
  getSuggestions(query) {
    return this.results.filter(
      (result) => result.address.toLowerCase().includes(query.toLowerCase())
    );
  }
  onChooseSuggestion(result) {
    this.plugin.insertProperties(result);
  }
  renderSuggestion({ address, lat, lng, info }, el) {
    el.createEl("div", {
      text: `${address} (${lat}, ${lng})`
    });
    if (info) {
      el.createEl("small", {
        text: info
      });
    }
  }
};

// src/search-modal.ts
var GeocodingSearchModal = class extends import_obsidian2.Modal {
  constructor(plugin, searchTerm) {
    super(plugin.app);
    this.plugin = plugin;
    this.searchTerm = searchTerm;
  }
  async onSubmit() {
    this.close();
    const results = await this.plugin.getResults(this.searchTerm);
    new GeocodingResultsModal(this.plugin, results).open();
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h1", {
      text: "Confirm search term"
    });
    new import_obsidian2.Setting(contentEl).setName("Name").addText((text) => {
      const component = text.setValue(this.searchTerm).onChange((value) => {
        this.searchTerm = value;
      });
      component.inputEl.style.width = "100%";
    });
    new import_obsidian2.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Submit").setCta().onClick(async () => {
        await this.onSubmit();
      })
    );
    contentEl.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await this.onSubmit();
      }
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/settings.ts
var propertyDescriptions = {
  address: {
    name: "Address",
    detail: "Format varies by provider"
  },
  lat: {
    name: "Latitude"
  },
  lng: {
    name: "Longitude"
  },
  location: {
    name: "Location",
    detail: "Coordinates in [lat, lng] format"
  },
  map_link: {
    name: "Map link"
  },
  map_view_link: {
    name: "Map view link",
    detail: "A link in [](geo:lat,lng) format"
  }
};
var defaultSettings = {
  properties: {
    address: {
      frontmatterKey: "address",
      enabled: true
    },
    lat: {
      frontmatterKey: "lat",
      enabled: false
    },
    lng: {
      frontmatterKey: "lng",
      enabled: false
    },
    location: {
      frontmatterKey: "location",
      enabled: false
    },
    map_link: {
      frontmatterKey: "map_link",
      enabled: false
    },
    map_view_link: {
      frontmatterKey: "map_view_link",
      enabled: false
    }
  },
  overrideExistingProperties: false,
  mapLinkProvider: "google",
  apiProvider: "free-geocoding-api",
  apiKey: ""
};

// src/settings-tab.ts
var import_obsidian3 = require("obsidian");
var GeocodingPluginSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Properties" });
    for (const [key, description] of Object.entries(
      propertyDescriptions
    )) {
      const property = this.plugin.settings.properties[key];
      new import_obsidian3.Setting(containerEl).setName(description.name || key).setDesc(description.detail || "").addText(
        (text) => text.setValue(property.frontmatterKey).onChange(async (value) => {
          if (!value) {
            return;
          }
          property.frontmatterKey = value;
          await this.plugin.saveSettings();
        })
      ).addToggle(
        (toggle) => toggle.setValue(property.enabled).onChange(async (value) => {
          property.enabled = value;
          await this.plugin.saveSettings();
        })
      );
    }
    containerEl.createEl("h2", { text: "Behavior" });
    new import_obsidian3.Setting(containerEl).setName("Override existing properties").setDesc(
      "Whether to override existing properties with the same name"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.overrideExistingProperties).onChange(async (value) => {
        this.plugin.settings.overrideExistingProperties = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Map link provider").setDesc("Provider for the map_link property, if enabled").addDropdown(
      (dropdown) => dropdown.addOptions({
        google: "Google Maps",
        apple: "Apple Maps",
        osm: "OpenStreetMap"
      }).setValue(this.plugin.settings.mapLinkProvider).onChange(async (value) => {
        switch (value) {
          case "google":
          case "apple":
          case "osm":
            this.plugin.settings.mapLinkProvider = value;
            break;
        }
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h2", { text: "API" });
    new import_obsidian3.Setting(containerEl).setName("API provider").addDropdown(
      (dropdown) => dropdown.addOptions({
        ["free-geocoding-api"]: "Free Geocoding API",
        ["google-geocoding"]: "Google Geocoding"
      }).setValue(this.plugin.settings.apiProvider).onChange(async (value) => {
        switch (value) {
          case "free-geocoding-api":
          case "google-geocoding":
            this.plugin.settings.apiProvider = value;
            break;
        }
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("API key").setDisabled(
      this.plugin.settings.apiProvider !== "google-geocoding"
    ).addText(
      (text) => text.setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/utils/fetch-free-geocoding-api-results.ts
var import_obsidian4 = require("obsidian");
var fetchFreeGeocodingAPIResults = async (searchTerm, apiKey) => {
  const params = new URLSearchParams({
    q: searchTerm,
    api_key: apiKey
  });
  const url = `https://geocode.maps.co/search?${params.toString()}`;
  const response = await (0, import_obsidian4.requestUrl)({
    url,
    throw: false
  });
  const retryAfter = response.headers["Retry-After"];
  switch (response.status) {
    case 200:
      break;
    case 401:
      throw new Error("Unauthorized. Please check your API key.");
    case 409:
    case 503:
      if (retryAfter) {
        throw new Error(
          `Too many requests. Please try again in ${retryAfter} seconds.`
        );
      }
      throw new Error("Too many requests. Please try again later.");
    default:
      throw new Error(`Server responded with ${response.status}`);
  }
  const results = response.json;
  return results.map((result) => ({
    address: result.display_name,
    lat: Number(result.lat),
    lng: Number(result.lon),
    info: `${result.class} ${result.type}`,
    id: result.osm_id.toString(),
    provider: "free-geocoding-api"
  }));
};

// src/utils/fetch-google-geocoding-results.ts
var import_obsidian5 = require("obsidian");
var fetchGoogleGeocodingResults = async (searchTerm, apiKey) => {
  const params = new URLSearchParams({
    address: searchTerm,
    key: apiKey
  });
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const response = await (0, import_obsidian5.requestUrl)({
    url,
    throw: false
  });
  if (response.status !== 200) {
    throw new Error(`Server responded with ${response.status}`);
  }
  const { status, results } = response.json;
  switch (status) {
    case "OK":
      break;
    case "ZERO_RESULTS":
      throw new Error("No results found");
    case "OVER_DAILY_LIMIT":
      throw new Error("Over daily limit");
    case "OVER_QUERY_LIMIT":
      throw new Error("Over query limit");
    case "REQUEST_DENIED":
      throw new Error("Request denied (invalid API key?)");
    default:
      throw new Error("Unknown API response");
  }
  return results.map((result) => ({
    address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    info: result.types.join(", "),
    id: result.place_id,
    provider: "google-geocoding"
  }));
};

// src/utils/make-apple-maps-link.ts
var makeAppleMapsLink = ({ address, lat, lng }) => {
  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    address
    // used only for display
  });
  return `https://maps.apple.com/?${params.toString()}`;
};

// src/utils/make-google-maps-link.ts
var makeGoogleMapsLink = ({
  id,
  provider,
  lat,
  lng
}) => {
  if (provider === "google-geocoding") {
    return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${id}`;
  }
  const params = new URLSearchParams({
    api: "1",
    // we can only query by lat,lng or address, so we choose the more precise option
    query: `${lat},${lng}`
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
};

// src/utils/make-osm-link.ts
var makeOsmLink = ({ id, provider, lat, lng }) => {
  if (provider === "free-geocoding-api") {
  }
  const params = new URLSearchParams({
    mlat: lat.toString(),
    mlon: lng.toString()
  });
  return `https://openstreetmap.org/?${params.toString()}`;
};

// src/main.ts
var GeocodingPlugin = class extends import_obsidian6.Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GeocodingPluginSettingTab(this.app, this));
    this.addCommand({
      id: "insert-into-current-note",
      name: "Insert properties into current note",
      editorCallback: async (_, ctx) => {
        const currentFile = ctx.file;
        if (!currentFile) {
          return;
        }
        const searchTerm = this.getSearchTerm(currentFile);
        new GeocodingSearchModal(this, searchTerm).open();
      }
    });
    this.addCommand({
      id: "insert-into-current-note-no-confirmation",
      name: "Insert properties into current note (no confirmation)",
      editorCallback: async (_, ctx) => {
        const currentFile = ctx.file;
        if (!currentFile) {
          return;
        }
        const searchTerm = this.getSearchTerm(currentFile);
        const results = await this.getResults(searchTerm);
        await this.insertProperties(results[0]);
      }
    });
  }
  getSearchTerm(file) {
    let searchTerm = file.basename;
    const metadataCache = this.app.metadataCache.getFileCache(file);
    if (metadataCache == null ? void 0 : metadataCache.frontmatter) {
      searchTerm = metadataCache.frontmatter.address || metadataCache.frontmatter.title || searchTerm;
    }
    return searchTerm;
  }
  async getResults(searchTerm) {
    const results = [];
    try {
      const { apiProvider, apiKey } = this.settings;
      switch (apiProvider) {
        case "free-geocoding-api":
          results.push(
            ...await fetchFreeGeocodingAPIResults(
              searchTerm,
              apiKey
            )
          );
          break;
        case "google-geocoding":
          results.push(
            ...await fetchGoogleGeocodingResults(
              searchTerm,
              apiKey
            )
          );
          break;
        default:
          throw new Error(`Invalid API provider: ${apiProvider}`);
      }
    } catch (error) {
      new import_obsidian6.Notice(String(error));
      throw error;
    }
    if (!(results == null ? void 0 : results.length)) {
      new import_obsidian6.Notice(`No results found for "${searchTerm}"`);
    }
    return results;
  }
  async insertProperties(result) {
    const currentFile = this.app.workspace.getActiveFile();
    if (!currentFile) {
      return;
    }
    const { overrideExistingProperties, mapLinkProvider, properties } = this.settings;
    this.app.fileManager.processFrontMatter(currentFile, (frontmatter) => {
      for (const [key, property] of Object.entries(properties)) {
        const shouldInsert = property.enabled && (overrideExistingProperties || frontmatter[property.frontmatterKey] === void 0);
        if (!shouldInsert) {
          continue;
        }
        switch (key) {
          case "location":
            frontmatter[property.frontmatterKey] = [
              result.lat.toString(),
              result.lng.toString()
            ];
            break;
          case "map_link":
            switch (mapLinkProvider) {
              case "google":
                frontmatter[property.frontmatterKey] = makeGoogleMapsLink(result);
                break;
              case "apple":
                frontmatter[property.frontmatterKey] = makeAppleMapsLink(result);
                break;
              case "osm":
                frontmatter[property.frontmatterKey] = makeOsmLink(result);
                break;
            }
            break;
          case "map_view_link": {
            frontmatter[property.frontmatterKey] = `[](geo:${result.lat},${result.lng})`;
            break;
          }
          default:
            frontmatter[property.frontmatterKey] = result[key];
            break;
        }
      }
    });
  }
  async loadSettings() {
    this.settings = (0, import_deepmerge.default)(defaultSettings, await this.loadData() || {});
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};

/* nosourcemap */