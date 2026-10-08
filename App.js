// =========================================================================
// 🎬 FESTIVAL DO RIO 2026 - GUIA OFICIAL COMPLETO (FILTROS MÚLTIPLOS/CUMULATIVOS)
// =========================================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  Modal,
  Share,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import programacaoData from './programacao_festival_2026.json';

const WATCHLISTS_KEY = '@festival_rio_watchlists_v3';
const ACTIVE_WATCHLIST_ID_KEY = '@festival_rio_active_watchlist_id';
const WATCHED_KEY = '@festival_rio_watched_2026';

// Helper de codificação e decodificação UTF-8 em Base64
const encodeBase64 = (str) => {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
        String.fromCharCode('0x' + p1)
      )
    );
  } catch (e) {
    return str;
  }
};

const decodeBase64 = (str) => {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    return str;
  }
};

// COORDENADAS GPS EXATAS DOS 15 CINEMAS DO FESTIVAL
const VENUE_COORDINATES = {
  'Cine Odeon - CCLSR': { lat: -22.911804, lng: -43.175825, address: 'Praça Floriano, 7 - Cinelândia' },
  'Kinoplex São Luiz': { lat: -22.926154, lng: -43.177028, address: 'Rua do Catete, 311 - Catete' },
  'Estação Claro Gávea': { lat: -22.975543, lng: -43.228221, address: 'Rua Marquês de São Vicente, 52 - Gávea' },
  'Cinesystem Belas Artes Botafogo': { lat: -22.946115, lng: -43.181286, address: 'Praia de Botafogo, 316 - Botafogo' },
  'CineCarioca José Wilker': { lat: -22.935105, lng: -43.185642, address: 'Rua Leite Leal, 45 - Laranjeiras' },
  'Reserva Cultural Niterói': { lat: -22.896683, lng: -43.128822, address: 'Av. Visconde do Rio Branco, 880 - Niterói' },
  'Estação Claro Rio': { lat: -22.952671, lng: -43.185011, address: 'Rua Voluntários da Pátria, 35 - Botafogo' },
  'Cine Santa Teresa': { lat: -22.920556, lng: -43.182778, address: 'Rua Paschoal Carlos Magno, 136 - Santa Teresa' },
  'CineCarioca Penha': { lat: -22.843611, lng: -43.277222, address: 'Av. Brás de Pina, 150 - Penha' },
  'Centro Cultural da Justiça Federal - CCJF - Cinema': { lat: -22.909722, lng: -43.175556, address: 'Av. Rio Branco, 241 - Centro' },
  'Centro Cultural da Justiça Federal - CCJF - Teatro': { lat: -22.909722, lng: -43.175556, address: 'Av. Rio Branco, 241 - Centro' },
  'CineCarioca Nova Brasília': { lat: -22.863889, lng: -43.265278, address: 'Rua Nova Brasília, S/N - Complexo do Alemão' },
  'Centro Cultural FGV': { lat: -22.941667, lng: -43.180278, address: 'Praia de Botafogo, 190 - Botafogo' },
  'Areninha Carioca Renato Russo': { lat: -22.801667, lng: -43.181667, address: 'Parque Poeta Manuel Bandeira, S/N - Cocotá, Ilha do Governador' },
  'Parque Realengo Susana Naspolini': { lat: -22.878333, lng: -43.431667, address: 'Rua Prof. Carlos Wenceslau, 290 - Realengo' },
};

const COUNTRY_FLAGS = {
  'Afeganistão': '🇦🇫', 'Alemanha': '🇩🇪', 'Argentina': '🇦🇷', 'Austrália': '🇦🇺',
  'Bangladesh': '🇧🇩', 'Bolívia': '🇧🇴', 'Brasil': '🇧🇷', 'Bulgária': '🇧🇬',
  'Bélgica': '🇧🇪', 'Cabo Verde': '🇨🇻', 'Camboja': '🇰🇭', 'Canadá': '🇨🇦',
  'Catar': '🇶🇦', 'Centro-Africana República': '🇨🇫', 'Chade': '🇹🇩', 'Chile': '🇨🇱',
  'China': '🇨🇳', 'Chipre': '🇨🇾', 'Colômbia': '🇨🇴', 'Congo República Democrática': '🇨🇩',
  'Coreia do Sul': '🇰🇷', 'Costa do Marfim': '🇨🇮', 'Croácia': '🇭🇷', 'Dinamarca': '🇩🇰',
  'Egito': '🇪🇬', 'Eslováquia': '🇸🇰', 'Espanha': '🇪🇸', 'Estados Unidos': '🇺🇸',
  'Estônia': '🇪🇪', 'Filipinas': '🇵🇭', 'França': '🇫🇷', 'Gabão': '🇬🇦',
  'Gana': '🇬🇭', 'Grécia': '🇬🇷', 'Haiti': '🇭🇹', 'Hong Kong': '🇭🇰',
  'Irlanda': '🇮🇪', 'Irã': '🇮🇷', 'Israel': '🇮🇱', 'Itália': '🇮🇹',
  'Japão': '🇯🇵', 'Kosovo': '🇽🇰', 'Letônia': '🇱🇻', 'Lituânia': '🇱🇹',
  'Luxemburgo': '🇱🇺', 'Líbano': '🇱🇧', 'Líbia': '🇱🇾', 'Macedônia': '🇲🇰',
  'Marrocos': '🇲🇦', 'Moldávia': '🇲🇩', 'México': '🇲🇽', 'Nepal': '🇳🇵',
  'Nigéria': '🇳🇬', 'Noruega': '🇳🇴', 'Nova Zelândia': '🇳🇿', 'Palestina': '🇵🇸',
  'Paquistão': '🇵🇰', 'Paraguai': '🇵🇾', 'Países Baixos': '🇳🇱', 'Polônia': '🇵🇱',
  'Portugal': '🇵🇹', 'Reino Unido': '🇬🇧', 'República Tcheca': '🇨🇿', 'Romênia': '🇷🇴',
  'Ruanda': '🇷🇼', 'Singapura': '🇸🇬', 'Suécia': '🇸🇪', 'Suíça': '🇨🇭',
  'Sérvia': '🇷🇸', 'Tailândia': '🇹🇭', 'Tunísia': '🇹🇳', 'Turquia': '🇹🇷',
  'Ucrânia': '🇺🇦', 'Uruguai': '🇺🇾', 'Vietnã': '🇻🇳', 'África do Sul': '🇿🇦',
  'Áustria': '🇦🇹', 'Índia': '🇮🇳',
};

const formatCountryWithFlags = (countryStr) => {
  if (!countryStr) return '';
  const sanitized = countryStr
    .replace('Norue- ga', 'Noruega')
    .replace('Repú- blica Tcheca', 'República Tcheca')
    .replace('Suíça Estados Unidos', 'Suíça, Estados Unidos')
    .replace('Espanha + 1 país', 'Espanha');

  return sanitized
    .split(',')
    .map((c) => {
      const clean = c.trim();
      const flag = COUNTRY_FLAGS[clean] || '🌎';
      return `${flag} ${clean}`;
    })
    .join(', ');
};

const parseDurationMin = (durStr) => {
  if (!durStr) return 0;
  const match = durStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const formatTotalHoursMin = (totalMinutes) => {
  if (!totalMinutes || totalMinutes === 0) return '0min';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h ${m > 0 ? `${m}min` : ''}`;
};

const getShiftFromTime = (timeStr) => {
  if (!timeStr) return 'Tarde';
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (isNaN(hour)) return 'Tarde';
  if (hour < 12) return 'Manhã';
  if (hour < 18) return 'Tarde';
  return 'Noite';
};

const toggleArrayItem = (list, item) => {
  if (list.includes(item)) {
    return list.filter((i) => i !== item);
  }
  return [...list, item];
};

const generateUniqueShortId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'RIO-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const CATEGORIES = [
  'Première Brasil', 'Panorama Mundial', 'Expectativa',
  'Première Latina', 'Midnight Movies', 'Clássicos & Cults',
  'O Estado das Coisas', 'Itinerários Únicos', 'Cinema Circulação',
];

const FESTIVALS_A = ['Qualquer Festival A', 'Oscar 🏆', 'Cannes', 'Veneza', 'Berlinale', 'Sundance'];
const SHIFTS = ['Manhã', 'Tarde', 'Noite'];

export default function App() {
  const [activeTab, setActiveTab] = useState('programacao');

  // FILTROS CUMULATIVOS DA PROGRAMAÇÃO (ARRAYS DE SELEÇÃO MÚLTIPLA)
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [selectedFestivalsA, setSelectedFestivalsA] = useState([]);
  const [watchlistFilter, setWatchlistFilter] = useState('Todos');
  const [hideWatched, setHideWatched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Watchlists & Comparador
  const [watchlistsMap, setWatchlistsMap] = useState({});
  const [activeWatchlistId, setActiveWatchlistId] = useState('');
  const [compareWatchlistId, setCompareWatchlistId] = useState('Nenhuma');
  const [onlyCommonSessions, setOnlyCommonSessions] = useState(false);

  // FILTROS CUMULATIVOS DA WATCHLIST
  const [wlSearchQuery, setWlSearchQuery] = useState('');
  const [wlSelectedCategories, setWlSelectedCategories] = useState([]);
  const [wlSelectedGenres, setWlSelectedGenres] = useState([]);
  const [wlSelectedCountries, setWlSelectedCountries] = useState([]);
  const [wlSelectedVenues, setWlSelectedVenues] = useState([]);
  const [wlSelectedDates, setWlSelectedDates] = useState([]);
  const [wlSelectedShifts, setWlSelectedShifts] = useState([]);
  const [wlSelectedFestivalsA, setWlSelectedFestivalsA] = useState([]);
  const [wlHideWatched, setWlHideWatched] = useState(false);

  const [watched, setWatched] = useState([]);
  const [expandedMovies, setExpandedMovies] = useState({});

  // Modais de Seleção
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [venueModalVisible, setVenueModalVisible] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [modalTargetTab, setModalTargetTab] = useState('programacao');

  const [importModalVisible, setCountryImportModalVisible] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState('');

  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    programacaoData.forEach((movie) => {
      if (movie.genre) {
        if (movie.genre.includes('Ficção')) genreSet.add('Ficção');
        if (movie.genre.includes('Documentário')) genreSet.add('Documentário');
        if (movie.genre.includes('Animação')) genreSet.add('Animação');
        if (movie.genre.includes('Comédia')) genreSet.add('Comédia');
        if (movie.genre.includes('Drama')) genreSet.add('Drama');
        if (movie.genre.includes('Terror') || movie.genre.includes('Thriller')) genreSet.add('Terror/Suspense');
      }
    });
    return Array.from(genreSet);
  }, []);

  const availableCountries = useMemo(() => {
    const countrySet = new Set();
    programacaoData.forEach((movie) => {
      if (movie.country) {
        const sanitized = movie.country
          .replace('Norue- ga', 'Noruega')
          .replace('Repú- blica Tcheca', 'República Tcheca')
          .replace('Suíça Estados Unidos', 'Suíça, Estados Unidos')
          .replace('Espanha + 1 país', 'Espanha');

        sanitized.split(',').forEach((c) => {
          const cleanCountry = c.trim();
          if (cleanCountry) countrySet.add(cleanCountry);
        });
      }
    });
    return Array.from(countrySet).sort((a, b) => a.localeCompare(b));
  }, []);

  const availableVenues = useMemo(() => {
    const venueSet = new Set();
    programacaoData.forEach((movie) => {
      if (movie.screenings) {
        movie.screenings.forEach((session) => {
          if (session.venue) venueSet.add(session.venue.trim());
        });
      }
    });
    return Array.from(venueSet).sort((a, b) => a.localeCompare(b));
  }, []);

  const availableDates = useMemo(() => {
    const dateMap = new Map();
    programacaoData.forEach((movie) => {
      if (movie.screenings) {
        movie.screenings.forEach((session) => {
          if (session.date) dateMap.set(session.date, session.day_of_week || session.date);
        });
      }
    });
    const sortedKeys = Array.from(dateMap.keys()).sort();
    const list = [];
    sortedKeys.forEach((d) => list.push({ date: d, label: dateMap.get(d) }));
    return list;
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const savedWatchlistsJson = await AsyncStorage.getItem(WATCHLISTS_KEY);
        let loadedMap = {};

        if (savedWatchlistsJson) loadedMap = JSON.parse(savedWatchlistsJson);

        if (!loadedMap || Object.keys(loadedMap).length === 0) {
          const mainId = generateUniqueShortId();
          loadedMap = {
            [mainId]: { id: mainId, name: 'Minha Watchlist Principal', sessions: [] },
          };
        }

        let savedActiveId = await AsyncStorage.getItem(ACTIVE_WATCHLIST_ID_KEY);
        if (!savedActiveId || !loadedMap[savedActiveId]) savedActiveId = Object.keys(loadedMap)[0];

        setWatchlistsMap(loadedMap);
        setActiveWatchlistId(savedActiveId);

        const savedWatched = await AsyncStorage.getItem(WATCHED_KEY);
        if (savedWatched !== null) setWatched(JSON.parse(savedWatched));

        if (typeof window !== 'undefined' && window.location && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const importData = params.get('import');
          if (importData) {
            handleImportFromPayload(importData, loadedMap);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    }
    loadData();
  }, []);

  const saveWatchlistsToStorage = async (newMap, activeId) => {
    try {
      setWatchlistsMap(newMap);
      if (activeId) setActiveWatchlistId(activeId);
      await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(newMap));
      if (activeId) await AsyncStorage.setItem(ACTIVE_WATCHLIST_ID_KEY, activeId);
    } catch (error) {
      console.error('Erro ao salvar no storage:', error);
    }
  };

  const activeWatchlistSessions = useMemo(() => {
    if (!activeWatchlistId || !watchlistsMap[activeWatchlistId]) return [];
    return watchlistsMap[activeWatchlistId].sessions || [];
  }, [activeWatchlistId, watchlistsMap]);

  const toggleWatchlist = async (sessionId) => {
    if (!activeWatchlistId || !watchlistsMap[activeWatchlistId]) return;

    const currentSessions = watchlistsMap[activeWatchlistId].sessions || [];
    const updatedSessions = currentSessions.includes(sessionId)
      ? currentSessions.filter((id) => id !== sessionId)
      : [...currentSessions, sessionId];

    const updatedMap = {
      ...watchlistsMap,
      [activeWatchlistId]: {
        ...watchlistsMap[activeWatchlistId],
        sessions: updatedSessions,
      },
    };

    await saveWatchlistsToStorage(updatedMap, activeWatchlistId);
  };

  const clearAllWatchlist = async () => {
    if (!activeWatchlistId) return;
    const updatedMap = {
      ...watchlistsMap,
      [activeWatchlistId]: {
        ...watchlistsMap[activeWatchlistId],
        sessions: [],
      },
    };
    await saveWatchlistsToStorage(updatedMap, activeWatchlistId);
  };

  const toggleWatched = async (movieId) => {
    try {
      const updatedList = watched.includes(movieId)
        ? watched.filter((id) => id !== movieId)
        : [...watched, movieId];

      setWatched(updatedList);
      await AsyncStorage.setItem(WATCHED_KEY, JSON.stringify(updatedList));
    } catch (error) {
      console.error('Erro ao guardar vistos:', error);
    }
  };

  const toggleSynopsis = (movieId) => {
    setExpandedMovies((prev) => ({ ...prev, [movieId]: !prev[movieId] }));
  };

  const openLetterboxd = (url) => {
    if (url) Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não abriu o Letterboxd.'));
  };

  const openUber = (session) => {
    const venueKey = session.venue ? session.venue.trim() : '';
    const coords = VENUE_COORDINATES[venueKey];

    let uberUrl = '';
    if (coords) {
      const fullAddress = `${venueKey}, ${coords.address}`;
      uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${coords.lat}&dropoff[longitude]=${coords.lng}&dropoff[formatted_address]=${encodeURIComponent(fullAddress)}&dropoff[nickname]=${encodeURIComponent(venueKey)}`;
    } else {
      const fallbackAddress = session.address
        ? `${session.venue}, ${session.address}, Rio de Janeiro - RJ, Brasil`
        : `${session.venue}, Rio de Janeiro - RJ, Brasil`;
      uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(fallbackAddress)}&dropoff[nickname]=${encodeURIComponent(session.venue)}`;
    }

    Linking.openURL(uberUrl).catch(() => Alert.alert('Erro', 'Não foi possível abrir o Uber.'));
  };

  const exportToGoogleCalendar = (movie, session) => {
    try {
      const [year, month, day] = session.date.split('-');
      const [hours, minutes] = session.time.split(':');
      const startDate = new Date(year, parseInt(month, 10) - 1, day, hours, minutes);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      const formatGCalDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const title = encodeURIComponent(`[Festival do Rio] ${movie.title}`);
      const details = encodeURIComponent(`Mostra: ${movie.section}\n${movie.credits || ''}\nSinopse:\n${movie.synopsis || ''}`);
      const location = encodeURIComponent(`${session.venue} (${session.address || ''}), Rio de Janeiro - RJ`);

      const url = `https://calendar.google.com/render?action=TEMPLATE&text=${title}&dates=${formatGCalDate(startDate)}/${formatGCalDate(endDate)}&details=${details}&location=${location}&ctz=America/Sao_Paulo`;
      Linking.openURL(url);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o Google Agenda.');
    }
  };

  const handleImportFromPayload = (codePayload, currentMap = watchlistsMap) => {
    try {
      const decodedPayload = decodeURIComponent(codePayload.trim());
      const firstColonIndex = decodedPayload.indexOf(':');

      let importedId = '';
      let restPayload = '';

      if (firstColonIndex !== -1) {
        importedId = decodedPayload.substring(0, firstColonIndex).trim();
        restPayload = decodedPayload.substring(firstColonIndex + 1).trim();
      } else {
        importedId = decodedPayload.trim();
        restPayload = '';
      }

      if (!importedId.startsWith('RIO-')) {
        importedId = `RIO-${importedId}`;
      }

      let importedSessions = [];

      if (restPayload) {
        try {
          const jsonStr = decodeBase64(restPayload);
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            importedSessions = parsed;
          } else if (parsed && Array.isArray(parsed.s)) {
            importedSessions = parsed.s;
          }
        } catch (e) {
          importedSessions = restPayload
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      const importedName = `Watchlist Amigo #${importedId.replace('RIO-', '')}`;

      const updatedMap = {
        ...currentMap,
        [importedId]: {
          id: importedId,
          name: currentMap[importedId]?.name || importedName,
          sessions: importedSessions,
        },
      };

      saveWatchlistsToStorage(updatedMap, importedId);
      setActiveWatchlistId(importedId);
      setActiveTab('watchlist'); 
      setCountryImportModalVisible(false);
      setImportCodeInput('');

      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      Alert.alert(
        'Watchlist Importada com Sucesso! 🎉',
        `A listagem "${importedName}" (${importedSessions.length} sessões) foi carregada!`
      );
    } catch (error) {
      console.error('Erro na importação:', error);
      Alert.alert('Erro na Importação', 'Verifique se o código ou link da watchlist está correto.');
    }
  };

  const generateSharePayload = () => {
    const listObj = watchlistsMap[activeWatchlistId];
    if (!listObj) return null;
    const sessionsArray = listObj.sessions || [];
    const b64Sessions = encodeBase64(JSON.stringify(sessionsArray));
    const shareCode = `${listObj.id}:${b64Sessions}`;
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://festival-do-rio-2026.vercel.app/';
    const shareUrl = `${baseUrl}?import=${encodeURIComponent(shareCode)}`;

    return {
      id: listObj.id,
      name: listObj.name,
      shareCode,
      shareUrl,
    };
  };

  const shareWatchlistNaturalText = async () => {
    const payload = generateSharePayload();
    if (!payload) return;

    if (activeWatchlistSessionsList.length === 0) {
      Alert.alert('Watchlist vazia', 'Adicione sessões para compartilhar!');
      return;
    }

    let text = `${payload.name} (ID: ${payload.id})\n\n`;
    text += `Sessões da minha programação no Festival do Rio:\n\n`;

    activeWatchlistSessionsList.forEach(({ movie, session }) => {
      text += `- ${movie.title}\n`;
      text += `  Sessão: ${session.day_of_week} às ${session.time}\n`;
      text += `  Local: ${session.venue}${session.address ? ` (${session.address})` : ''}\n\n`;
    });

    text += `Para abrir e importar esta lista direto no app:\n${payload.shareUrl}\n\nBora ao cinema juntos!`;

    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const shareWatchlistIdOnly = async () => {
    const payload = generateSharePayload();
    if (!payload) return;

    let text = `ID da minha Watchlist: ${payload.id}\n\n`;
    text += `Link direto para abrir e importar:\n${payload.shareUrl}`;

    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Erro ao compartilhar ID:', error);
    }
  };

  // VERIFICAÇÃO MULTI-SELEÇÃO CUMULATIVA DE SESSÃO
  const sessionMatchesFilters = (session, filterDates, filterVenues, filterShifts) => {
    const matchesDate = filterDates.length === 0 || filterDates.includes(session.date);
    const matchesVenue =
      filterVenues.length === 0 ||
      filterVenues.some((v) => session.venue && session.venue.toLowerCase().includes(v.toLowerCase()));
    const matchesShift =
      filterShifts.length === 0 || filterShifts.includes(getShiftFromTime(session.time));

    return matchesDate && matchesVenue && matchesShift;
  };

  const filteredMovies = useMemo(() => {
    return programacaoData.filter((movie) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((c) => movie.section && movie.section.toLowerCase().includes(c.toLowerCase()));

      const matchesGenre =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => movie.genre && movie.genre.toLowerCase().includes(g.toLowerCase()));

      const matchesCountry =
        selectedCountries.length === 0 ||
        selectedCountries.some((c) => movie.country && movie.country.toLowerCase().includes(c.toLowerCase()));

      const matchesFestivalA =
        selectedFestivalsA.length === 0 ||
        selectedFestivalsA.some((f) => {
          if (f === 'Qualquer Festival A') return movie.festival_a && movie.festival_a.trim() !== '';
          if (f === 'Oscar 🏆') return movie.is_oscar || (movie.synopsis && movie.synopsis.toLowerCase().includes('oscar'));
          return movie.festival_a && movie.festival_a.toLowerCase().includes(f.toLowerCase());
        });

      const isMovieInWatchlist =
        movie.screenings &&
        movie.screenings.some((s) => {
          const sessionId = `${movie.id}_${s.date}_${s.time}_${s.venue}`;
          const isSaved = activeWatchlistSessions.includes(sessionId);
          const matchesDateIfSelected = selectedDates.length === 0 || selectedDates.includes(s.date);
          return isSaved && matchesDateIfSelected;
        });

      const matchesWatchlistFilter =
        watchlistFilter === 'Todos' ||
        (watchlistFilter === 'Sim' && isMovieInWatchlist) ||
        (watchlistFilter === 'Não' && !isMovieInWatchlist);

      const matchesHideWatched = !hideWatched || !watched.includes(movie.id);

      const hasMatchingSession =
        movie.screenings &&
        movie.screenings.some((s) => sessionMatchesFilters(s, selectedDates, selectedVenues, selectedShifts));

      const matchesSearch =
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (movie.credits && movie.credits.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (movie.synopsis && movie.synopsis.toLowerCase().includes(searchQuery.toLowerCase()));

      return (
        matchesCategory &&
        matchesGenre &&
        matchesCountry &&
        matchesFestivalA &&
        matchesWatchlistFilter &&
        matchesHideWatched &&
        hasMatchingSession &&
        matchesSearch
      );
    });
  }, [
    selectedCategories, selectedGenres, selectedCountries, selectedVenues,
    selectedDates, selectedShifts, selectedFestivalsA, watchlistFilter,
    hideWatched, activeWatchlistSessions, watched, searchQuery,
  ]);

  const activeWatchlistSessionsList = useMemo(() => {
    const list = [];
    programacaoData.forEach((movie) => {
      if (movie.screenings) {
        movie.screenings.forEach((session) => {
          const sessionUniqueId = `${movie.id}_${session.date}_${session.time}_${session.venue}`;
          if (activeWatchlistSessions.includes(sessionUniqueId)) {
            list.push({ movie, session, sessionUniqueId });
          }
        });
      }
    });
    return list;
  }, [activeWatchlistSessions]);

  const watchlistAvailableDates = useMemo(() => {
    const dateMap = new Map();
    activeWatchlistSessionsList.forEach((item) => {
      if (item.session && item.session.date) {
        dateMap.set(item.session.date, item.session.day_of_week || item.session.date);
      }
    });
    const sortedKeys = Array.from(dateMap.keys()).sort();
    const list = [];
    sortedKeys.forEach((d) => {
      list.push({ date: d, label: dateMap.get(d) });
    });
    return list;
  }, [activeWatchlistSessionsList]);

  const comparisonSessions = useMemo(() => {
    if (compareWatchlistId === 'Nenhuma' || !watchlistsMap[compareWatchlistId]) return [];
    return watchlistsMap[compareWatchlistId].sessions || [];
  }, [compareWatchlistId, watchlistsMap]);

  // NOVO: APLICAÇÃO DE FILTROS MÚLTIPLOS CUMULATIVOS NA WATCHLIST
  const displayedWatchlistSessions = useMemo(() => {
    let list = activeWatchlistSessionsList;

    // Filtro do Comparador
    if (onlyCommonSessions && compareWatchlistId !== 'Nenhuma') {
      list = list.filter((item) => comparisonSessions.includes(item.sessionUniqueId));
    }

    // Busca por Texto
    if (wlSearchQuery.trim() !== '') {
      const q = wlSearchQuery.toLowerCase();
      list = list.filter(({ movie }) =>
        movie.title.toLowerCase().includes(q) ||
        (movie.credits && movie.credits.toLowerCase().includes(q)) ||
        (movie.synopsis && movie.synopsis.toLowerCase().includes(q))
      );
    }

    // Mostras
    if (wlSelectedCategories.length > 0) {
      list = list.filter(({ movie }) =>
        movie.section && wlSelectedCategories.some((c) => movie.section.toLowerCase().includes(c.toLowerCase()))
      );
    }

    // Prêmios / Festivais A / Oscar
    if (wlSelectedFestivalsA.length > 0) {
      list = list.filter(({ movie }) =>
        wlSelectedFestivalsA.some((f) => {
          if (f === 'Qualquer Festival A') return movie.festival_a && movie.festival_a.trim() !== '';
          if (f === 'Oscar 🏆') return movie.is_oscar || (movie.synopsis && movie.synopsis.toLowerCase().includes('oscar'));
          return movie.festival_a && movie.festival_a.toLowerCase().includes(f.toLowerCase());
        })
      );
    }

    // Gênero
    if (wlSelectedGenres.length > 0) {
      list = list.filter(({ movie }) =>
        movie.genre && wlSelectedGenres.some((g) => movie.genre.toLowerCase().includes(g.toLowerCase()))
      );
    }

    // País
    if (wlSelectedCountries.length > 0) {
      list = list.filter(({ movie }) =>
        movie.country && wlSelectedCountries.some((c) => movie.country.toLowerCase().includes(c.toLowerCase()))
      );
    }

    // Cinema
    if (wlSelectedVenues.length > 0) {
      list = list.filter(({ session }) =>
        session.venue && wlSelectedVenues.some((v) => session.venue.toLowerCase().includes(v.toLowerCase()))
      );
    }

    // Turno
    if (wlSelectedShifts.length > 0) {
      list = list.filter(({ session }) =>
        wlSelectedShifts.includes(getShiftFromTime(session.time))
      );
    }

    // Dia
    if (wlSelectedDates.length > 0) {
      list = list.filter(({ session }) => wlSelectedDates.includes(session.date));
    }

    // Ocultar Vistos
    if (wlHideWatched) {
      list = list.filter(({ movie }) => !watched.includes(movie.id));
    }

    // Ordenação Cronológica Automática
    list.sort((a, b) => {
      const dateA = a.session?.date || '';
      const dateB = b.session?.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      
      const timeA = a.session?.time || '';
      const timeB = b.session?.time || '';
      return timeA.localeCompare(timeB);
    });

    return list;
  }, [
    activeWatchlistSessionsList, comparisonSessions, onlyCommonSessions,
    compareWatchlistId, wlSearchQuery, wlSelectedCategories, wlSelectedFestivalsA,
    wlSelectedGenres, wlSelectedCountries, wlSelectedVenues, wlSelectedShifts,
    wlSelectedDates, wlHideWatched, watched
  ]);

  const watchedMoviesList = useMemo(() => {
    return programacaoData.filter((movie) => watched.includes(movie.id));
  }, [watched]);

  const shareWatchedAsText = async () => {
    if (watchedMoviesList.length === 0) {
      Alert.alert('Lista vazia', 'Você ainda não marcou nenhum filme como visto!');
      return;
    }

    let text = `Filmes que ja assisti no Festival do Rio 2026 (${watchedMoviesList.length}):\n\n`;
    watchedMoviesList.forEach((movie) => {
      text += `- ${movie.title} (${movie.section})\n`;
      if (movie.credits) text += `  ${movie.credits}\n`;
      if (movie.letterboxd) text += `  Letterboxd: ${movie.letterboxd}\n`;
      text += '\n';
    });

    try {
      await Share.share({ message: text });
    } catch (error) {
      console.error('Erro ao compartilhar vistos:', error);
    }
  };

  const stats = useMemo(() => {
    let watchlistMinutes = 0;
    const watchlistMovieSet = new Set();
    activeWatchlistSessionsList.forEach(({ movie }) => {
      if (!watchlistMovieSet.has(movie.id)) {
        watchlistMovieSet.add(movie.id);
        watchlistMinutes += parseDurationMin(movie.duration);
      }
    });

    let watchedMinutes = 0;
    watchedMoviesList.forEach((movie) => {
      watchedMinutes += parseDurationMin(movie.duration);
    });

    let nationalWatched = 0;
    let intlWatched = 0;
    watchedMoviesList.forEach((m) => {
      if (m.country && m.country.toLowerCase().includes('brasil')) nationalWatched++;
      else intlWatched++;
    });

    const genreCounts = {};
    watchedMoviesList.forEach((m) => {
      const g = m.genre || 'Outros';
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    const venueCounts = {};
    watchedMoviesList.forEach((movie) => {
      const savedSessionsForMovie = activeWatchlistSessionsList.filter((s) => s.movie.id === movie.id);
      if (savedSessionsForMovie.length > 0) {
        savedSessionsForMovie.forEach(({ session }) => {
          const v = session.venue || 'Outro';
          venueCounts[v] = (venueCounts[v] || 0) + 1;
        });
      } else if (movie.screenings && movie.screenings.length > 0) {
        movie.screenings.forEach((session) => {
          const v = session.venue || 'Outro';
          venueCounts[v] = (venueCounts[v] || 0) + 1;
        });
      }
    });

    return {
      totalWatchlistSessions: activeWatchlistSessionsList.length,
      totalWatchedMovies: watchedMoviesList.length,
      watchlistTimeStr: formatTotalHoursMin(watchlistMinutes),
      watchedTimeStr: formatTotalHoursMin(watchedMinutes),
      nationalWatched,
      intlWatched,
      genreCounts,
      venueCounts,
    };
  }, [activeWatchlistSessionsList, watchedMoviesList]);

  const filteredCountriesForModal = useMemo(() => {
    return availableCountries.filter((c) =>
      c.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [availableCountries, countrySearch]);

  const filteredVenuesForModal = useMemo(() => {
    return availableVenues.filter((v) =>
      v.toLowerCase().includes(venueSearch.toLowerCase())
    );
  }, [availableVenues, venueSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FESTIVAL DO RIO 2026</Text>
        <Text style={styles.headerSubtitle}>Guia Oficial, Catálogo & Watchlist</Text>
      </View>

      {/* Navegação entre Abas */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'programacao' && styles.activeTabButton]}
          onPress={() => setActiveTab('programacao')}
        >
          <Text style={[styles.tabText, activeTab === 'programacao' && styles.activeTabText]}>
            📅 Agenda
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'watchlist' && styles.activeTabButton]}
          onPress={() => setActiveTab('watchlist')}
        >
          <Text style={[styles.tabText, activeTab === 'watchlist' && styles.activeTabText]}>
            ⭐ Watchlist ({activeWatchlistSessions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'vistos' && styles.activeTabButton]}
          onPress={() => setActiveTab('vistos')}
        >
          <Text style={[styles.tabText, activeTab === 'vistos' && styles.activeTabText]}>
            ✅ Vistos ({watched.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'estatisticas' && styles.activeTabButton]}
          onPress={() => setActiveTab('estatisticas')}
        >
          <Text style={[styles.tabText, activeTab === 'estatisticas' && styles.activeTabText]}>
            📊 Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo por Aba */}
      {activeTab === 'programacao' ? (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar filme, sinopse, diretor, Oscar..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* FILTROS CUMULATIVOS DA PROGRAMAÇÃO */}
          <View style={styles.filtersSection}>
            {/* Mostras Múltiplas */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <Text style={styles.filterLabel}>Mostras:</Text>
              <TouchableOpacity
                style={[styles.chip, selectedCategories.length === 0 && styles.activeChip]}
                onPress={() => setSelectedCategories([])}
              >
                <Text style={[styles.chipText, selectedCategories.length === 0 && styles.activeChipText]}>Todas</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selectedCategories.includes(cat) && styles.activeChip]}
                  onPress={() => setSelectedCategories(toggleArrayItem(selectedCategories, cat))}
                >
                  <Text style={[styles.chipText, selectedCategories.includes(cat) && styles.activeChipText]}>
                    {selectedCategories.includes(cat) ? `✓ ${cat}` : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Prêmios Múltiplos */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <Text style={styles.filterLabel}>Prêmios:</Text>
              <TouchableOpacity
                style={[styles.chip, selectedFestivalsA.length === 0 && styles.activeChipFestivalA]}
                onPress={() => setSelectedFestivalsA([])}
              >
                <Text style={[styles.chipText, selectedFestivalsA.length === 0 && styles.activeChipText]}>Todos</Text>
              </TouchableOpacity>
              {FESTIVALS_A.map((fest) => (
                <TouchableOpacity
                  key={fest}
                  style={[styles.chip, selectedFestivalsA.includes(fest) && styles.activeChipFestivalA]}
                  onPress={() => setSelectedFestivalsA(toggleArrayItem(selectedFestivalsA, fest))}
                >
                  <Text style={[styles.chipText, selectedFestivalsA.includes(fest) && styles.activeChipText]}>
                    {selectedFestivalsA.includes(fest) ? `✓ ${fest}` : fest}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filtros em linha */}
            <View style={styles.secondaryFilterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>Filtros:</Text>

                <TouchableOpacity
                  style={[styles.chip, watchlistFilter !== 'Todos' && styles.activeChipWatchlist]}
                  onPress={() => {
                    if (watchlistFilter === 'Todos') setWatchlistFilter('Sim');
                    else if (watchlistFilter === 'Sim') setWatchlistFilter('Não');
                    else setWatchlistFilter('Todos');
                  }}
                >
                  <Text style={[styles.chipText, watchlistFilter !== 'Todos' && styles.activeChipText]}>
                    {watchlistFilter === 'Sim' ? '⭐ Na Watchlist (Sim)' : watchlistFilter === 'Não' ? '🚫 Fora da Watchlist (Não)' : '⭐ Watchlist: Todos'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, hideWatched && styles.activeChipHideWatched]}
                  onPress={() => setHideWatched(!hideWatched)}
                >
                  <Text style={[styles.chipText, hideWatched && styles.activeChipText]}>
                    {hideWatched ? '🙈 Ocultando Vistos' : '👁️ Ocultar Vistos'}
                  </Text>
                </TouchableOpacity>

                {availableGenres.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[styles.chip, selectedGenres.includes(genre) && styles.activeChipGenre]}
                    onPress={() => setSelectedGenres(toggleArrayItem(selectedGenres, genre))}
                  >
                    <Text style={[styles.chipText, selectedGenres.includes(genre) && styles.activeChipText]}>
                      {selectedGenres.includes(genre) ? `✓ ${genre}` : genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.countrySelectButton, selectedCountries.length > 0 && styles.activeCountryButton]}
                onPress={() => {
                  setModalTargetTab('programacao');
                  setCountryModalVisible(true);
                }}
              >
                <Text style={styles.countrySelectText}>
                  {selectedCountries.length === 0
                    ? '🌎 País ▼'
                    : selectedCountries.length === 1
                    ? `${COUNTRY_FLAGS[selectedCountries[0]] || '🌎'} ${selectedCountries[0]} ▼`
                    : `🌎 ${selectedCountries.length} Países ▼`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.countrySelectButton, selectedVenues.length > 0 && styles.activeVenueButton]}
                onPress={() => {
                  setModalTargetTab('programacao');
                  setVenueModalVisible(true);
                }}
              >
                <Text style={styles.countrySelectText}>
                  {selectedVenues.length === 0
                    ? '📍 Cinema ▼'
                    : selectedVenues.length === 1
                    ? `📍 ${selectedVenues[0]} ▼`
                    : `📍 ${selectedVenues.length} Cinemas ▼`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Turnos e Datas Múltiplos */}
            <View style={[styles.secondaryFilterRow, { marginTop: 6 }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>Turno:</Text>
                {SHIFTS.map((shift) => (
                  <TouchableOpacity
                    key={shift}
                    style={[styles.chip, selectedShifts.includes(shift) && styles.activeChipShift]}
                    onPress={() => setSelectedShifts(toggleArrayItem(selectedShifts, shift))}
                  >
                    <Text style={[styles.chipText, selectedShifts.includes(shift) && styles.activeChipText]}>
                      {selectedShifts.includes(shift) ? `✓ ${shift}` : shift}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.countrySelectButton, selectedDates.length > 0 && styles.activeDateButton]}
                onPress={() => {
                  setModalTargetTab('programacao');
                  setDateModalVisible(true);
                }}
              >
                <Text style={styles.countrySelectText}>
                  {selectedDates.length === 0
                    ? '📅 Data ▼'
                    : selectedDates.length === 1
                    ? `📅 ${availableDates.find((d) => d.date === selectedDates[0])?.label || selectedDates[0]} ▼`
                    : `📅 ${selectedDates.length} Dias ▼`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contador de Resultados */}
          <View style={styles.resultCountBar}>
            <Text style={styles.resultCountText}>
              Exibindo {filteredMovies.length} de {programacaoData.length} filmes ({watched.length} vistos)
            </Text>
            {(selectedCategories.length > 0 ||
              selectedGenres.length > 0 ||
              selectedCountries.length > 0 ||
              selectedVenues.length > 0 ||
              selectedDates.length > 0 ||
              selectedShifts.length > 0 ||
              selectedFestivalsA.length > 0 ||
              watchlistFilter !== 'Todos' ||
              hideWatched ||
              searchQuery !== '') && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategories([]);
                  setSelectedGenres([]);
                  setSelectedCountries([]);
                  setSelectedVenues([]);
                  setSelectedDates([]);
                  setSelectedShifts([]);
                  setSelectedFestivalsA([]);
                  setWatchlistFilter('Todos');
                  setHideWatched(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.clearFiltersText}>Limpar todos os filtros</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de Filmes da Programação */}
          <FlatList
            data={filteredMovies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isExpanded = expandedMovies[item.id];
              const isMovieWatched = watched.includes(item.id);

              let screeningsToDisplay = item.screenings
                ? item.screenings.filter((s) => sessionMatchesFilters(s, selectedDates, selectedVenues, selectedShifts))
                : [];

              if (watchlistFilter === 'Sim') {
                screeningsToDisplay = screeningsToDisplay.filter((s) =>
                  activeWatchlistSessions.includes(`${item.id}_${s.date}_${s.time}_${s.venue}`)
                );
              }

              return (
                <View style={[styles.card, isMovieWatched && styles.cardWatched]}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.badge}>{item.section}</Text>
                    {isMovieWatched ? <Text style={styles.watchedBadge}>✅ Visto</Text> : null}
                    {item.festival_a ? (
                      <Text style={styles.festivalABadge}>
                        🏆 {item.festival_a}
                        {item.festival_a_section ? ` • ${item.festival_a_section}` : ''}
                      </Text>
                    ) : null}
                    {item.is_oscar ? <Text style={styles.oscarBadge}>🏆 {item.oscar_info || 'Oscar'}</Text> : null}
                    {item.genre ? <Text style={styles.genreBadge}>🎬 {item.genre}</Text> : null}
                    {item.duration ? <Text style={styles.metaBadge}>⏱ {item.duration}</Text> : null}
                    {item.country ? <Text style={styles.metaBadge}>{formatCountryWithFlags(item.country)}</Text> : null}
                    {item.year ? <Text style={styles.metaBadge}>📅 {item.year}</Text> : null}
                  </View>

                  <View style={styles.titleRow}>
                    <Text style={[styles.movieTitle, isMovieWatched && styles.movieTitleWatched]}>
                      {item.title}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.watchedToggleBtn, isMovieWatched && styles.watchedToggleBtnActive]}
                        onPress={() => toggleWatched(item.id)}
                      >
                        <Text style={[styles.watchedToggleText, isMovieWatched && styles.watchedToggleTextActive]}>
                          {isMovieWatched ? '✅ Visto' : '👁️ Marcar visto'}
                        </Text>
                      </TouchableOpacity>

                      {item.letterboxd ? (
                        <TouchableOpacity
                          style={styles.letterboxdBtn}
                          onPress={() => openLetterboxd(item.letterboxd)}
                        >
                          <Text style={styles.letterboxdBtnText}>💚 Letterboxd</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {item.credits ? <Text style={styles.credits}>{item.credits}</Text> : null}

                  {item.synopsis ? (
                    <View style={styles.synopsisContainer}>
                      <Text style={styles.synopsisText} numberOfLines={isExpanded ? undefined : 3}>
                        {item.synopsis}
                      </Text>
                      {isExpanded && item.full_technical_sheet ? (
                        <View style={styles.bioBox}>
                          <Text style={styles.bioTitle}>📋 Ficha Técnica:</Text>
                          <Text style={styles.bioText}>{item.full_technical_sheet}</Text>
                        </View>
                      ) : null}
                      <TouchableOpacity onPress={() => toggleSynopsis(item.id)}>
                        <Text style={styles.expandText}>
                          {isExpanded ? 'Ler menos ▲' : 'Ler sinopse & ficha técnica completas ▼'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <Text style={styles.sessionsHeader}>Sessões disponíveis:</Text>
                  {screeningsToDisplay.map((session, idx) => {
                    const sessionId = `${item.id}_${session.date}_${session.time}_${session.venue}`;
                    const isSaved = activeWatchlistSessions.includes(sessionId);

                    return (
                      <View key={idx} style={styles.sessionRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sessionDate}>📅 {session.day_of_week} às {session.time} ({getShiftFromTime(session.time)})</Text>
                          <Text style={styles.sessionVenue}>📍 {session.venue}</Text>
                          {session.address ? <Text style={styles.sessionAddress}>🏠 {session.address}</Text> : null}
                          {session.has_qna && <Text style={styles.qnaBadge}>★ Com Debate (Q&A)</Text>}
                        </View>

                        <View style={styles.actionButtons}>
                          <TouchableOpacity style={styles.uberButton} onPress={() => openUber(session)}>
                            <Text style={styles.uberButtonText}>🚗 Uber</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.gcalButton} onPress={() => exportToGoogleCalendar(item, session)}>
                            <Text style={styles.gcalButtonText}>+ Agenda</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.saveButton, isSaved && styles.savedButton]}
                            onPress={() => toggleWatchlist(sessionId)}
                          >
                            <Text style={styles.saveButtonText}>{isSaved ? '✓' : '+ Watchlist'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            }}
          />
        </>
      ) : activeTab === 'watchlist' ? (
        /* Aba 2: WATCHLIST MÚLTIPLA & FILTROS CUMULATIVOS */
        <FlatList
          data={displayedWatchlistSessions}
          keyExtractor={(item) => item.sessionUniqueId}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={{ gap: 10, marginBottom: 16 }}>
              {/* Seleção e Importação de Watchlists */}
              <View style={styles.watchlistHeaderRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  {Object.values(watchlistsMap).map((wl) => (
                    <TouchableOpacity
                      key={wl.id}
                      style={[
                        styles.chip,
                        activeWatchlistId === wl.id && styles.activeChip,
                        { paddingHorizontal: 14, paddingVertical: 8 },
                      ]}
                      onPress={() => saveWatchlistsToStorage(watchlistsMap, wl.id)}
                    >
                      <Text style={[styles.chipText, activeWatchlistId === wl.id && styles.activeChipText]}>
                        ⭐ {wl.name} ({wl.sessions?.length || 0})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.importBtnHeader}
                  onPress={() => setCountryImportModalVisible(true)}
                >
                  <Text style={styles.importBtnHeaderText}>📥 Importar ID</Text>
                </TouchableOpacity>
              </View>

              {watchlistsMap[activeWatchlistId] && (
                <View style={styles.watchlistInfoCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.watchlistInfoTitle}>
                      {watchlistsMap[activeWatchlistId].name}
                    </Text>
                    <Text style={styles.watchlistInfoIdBadge}>
                      ID: {watchlistsMap[activeWatchlistId].id}
                    </Text>
                  </View>

                  <View style={{ gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={styles.shareWatchlistButton}
                      onPress={shareWatchlistNaturalText}
                    >
                      <Text style={styles.shareWatchlistText}>
                        📱 Compartilhar em Texto Natural (WhatsApp)
                      </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.shareWatchlistButton, { flex: 1, backgroundColor: '#1E88E5' }]}
                        onPress={shareWatchlistIdOnly}
                      >
                        <Text style={styles.shareWatchlistText}>
                          🔗 Copiar Apenas ID / Link
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.clearWatchlistButton}
                        onPress={clearAllWatchlist}
                      >
                        <Text style={styles.clearWatchlistText}>🗑️ Limpar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Comparador de Amigos */}
              {Object.keys(watchlistsMap).length > 1 && (
                <View style={styles.comparisonSection}>
                  <Text style={styles.comparisonLabel}>🔄 Comparar com a lista de um amigo:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        compareWatchlistId === 'Nenhuma' && styles.activeChipHideWatched,
                      ]}
                      onPress={() => {
                        setCompareWatchlistId('Nenhuma');
                        setOnlyCommonSessions(false);
                      }}
                    >
                      <Text style={[styles.chipText, compareWatchlistId === 'Nenhuma' && styles.activeChipText]}>
                        Nenhuma comparação
                      </Text>
                    </TouchableOpacity>

                    {Object.values(watchlistsMap)
                      .filter((wl) => wl.id !== activeWatchlistId)
                      .map((wl) => (
                        <TouchableOpacity
                          key={wl.id}
                          style={[
                            styles.chip,
                            compareWatchlistId === wl.id && styles.activeChipVenue,
                          ]}
                          onPress={() => setCompareWatchlistId(wl.id)}
                        >
                          <Text style={[styles.chipText, compareWatchlistId === wl.id && styles.activeChipText]}>
                            👥 Comparar com {wl.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>

                  {compareWatchlistId !== 'Nenhuma' && (
                    <TouchableOpacity
                      style={[styles.commonFilterBtn, onlyCommonSessions && styles.commonFilterBtnActive]}
                      onPress={() => setOnlyCommonSessions(!onlyCommonSessions)}
                    >
                      <Text style={styles.commonFilterText}>
                        {onlyCommonSessions
                          ? '🔥 Mostrando APENAS Sessões em Comum'
                          : '👥 Filtrar para ver Apenas Sessões em Comum'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* BARRA CUMULATIVA DE FILTROS DA WATCHLIST */}
              <View style={[styles.filtersSection, { paddingHorizontal: 0, marginTop: 4 }]}>
                {/* Busca por texto */}
                <View style={{ marginBottom: 8 }}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar na watchlist (título, sinopse, diretor)..."
                    placeholderTextColor="#888"
                    value={wlSearchQuery}
                    onChangeText={setWlSearchQuery}
                  />
                </View>

                {/* Mostras */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  <Text style={styles.filterLabel}>Mostras:</Text>
                  <TouchableOpacity
                    style={[styles.chip, wlSelectedCategories.length === 0 && styles.activeChip]}
                    onPress={() => setWlSelectedCategories([])}
                  >
                    <Text style={[styles.chipText, wlSelectedCategories.length === 0 && styles.activeChipText]}>Todas</Text>
                  </TouchableOpacity>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, wlSelectedCategories.includes(cat) && styles.activeChip]}
                      onPress={() => setWlSelectedCategories(toggleArrayItem(wlSelectedCategories, cat))}
                    >
                      <Text style={[styles.chipText, wlSelectedCategories.includes(cat) && styles.activeChipText]}>
                        {wlSelectedCategories.includes(cat) ? `✓ ${cat}` : cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Prêmios / Festivais */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  <Text style={styles.filterLabel}>Prêmios:</Text>
                  <TouchableOpacity
                    style={[styles.chip, wlSelectedFestivalsA.length === 0 && styles.activeChipFestivalA]}
                    onPress={() => setWlSelectedFestivalsA([])}
                  >
                    <Text style={[styles.chipText, wlSelectedFestivalsA.length === 0 && styles.activeChipText]}>Todos</Text>
                  </TouchableOpacity>
                  {FESTIVALS_A.map((fest) => (
                    <TouchableOpacity
                      key={fest}
                      style={[styles.chip, wlSelectedFestivalsA.includes(fest) && styles.activeChipFestivalA]}
                      onPress={() => setWlSelectedFestivalsA(toggleArrayItem(wlSelectedFestivalsA, fest))}
                    >
                      <Text style={[styles.chipText, wlSelectedFestivalsA.includes(fest) && styles.activeChipText]}>
                        {wlSelectedFestivalsA.includes(fest) ? `✓ ${fest}` : fest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Gênero, País, Cinema e Ocultar Vistos */}
                <View style={styles.secondaryFilterRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Filtros:</Text>

                    <TouchableOpacity
                      style={[styles.chip, wlHideWatched && styles.activeChipHideWatched]}
                      onPress={() => setWlHideWatched(!wlHideWatched)}
                    >
                      <Text style={[styles.chipText, wlHideWatched && styles.activeChipText]}>
                        {wlHideWatched ? '🙈 Ocultando Vistos' : '👁️ Ocultar Vistos'}
                      </Text>
                    </TouchableOpacity>

                    {availableGenres.map((genre) => (
                      <TouchableOpacity
                        key={genre}
                        style={[styles.chip, wlSelectedGenres.includes(genre) && styles.activeChipGenre]}
                        onPress={() => setWlSelectedGenres(toggleArrayItem(wlSelectedGenres, genre))}
                      >
                        <Text style={[styles.chipText, wlSelectedGenres.includes(genre) && styles.activeChipText]}>
                          {wlSelectedGenres.includes(genre) ? `✓ ${genre}` : genre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity
                    style={[styles.countrySelectButton, wlSelectedCountries.length > 0 && styles.activeCountryButton]}
                    onPress={() => {
                      setModalTargetTab('watchlist');
                      setCountryModalVisible(true);
                    }}
                  >
                    <Text style={styles.countrySelectText}>
                      {wlSelectedCountries.length === 0
                        ? '🌎 País ▼'
                        : wlSelectedCountries.length === 1
                        ? `${COUNTRY_FLAGS[wlSelectedCountries[0]] || '🌎'} ${wlSelectedCountries[0]} ▼`
                        : `🌎 ${wlSelectedCountries.length} Países ▼`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.countrySelectButton, wlSelectedVenues.length > 0 && styles.activeVenueButton]}
                    onPress={() => {
                      setModalTargetTab('watchlist');
                      setVenueModalVisible(true);
                    }}
                  >
                    <Text style={styles.countrySelectText}>
                      {wlSelectedVenues.length === 0
                        ? '📍 Cinema ▼'
                        : wlSelectedVenues.length === 1
                        ? `📍 ${wlSelectedVenues[0]} ▼`
                        : `📍 ${wlSelectedVenues.length} Cinemas ▼`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Turnos e Datas */}
                <View style={[styles.secondaryFilterRow, { marginTop: 6 }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Turnos:</Text>
                    {SHIFTS.map((shift) => (
                      <TouchableOpacity
                        key={shift}
                        style={[styles.chip, wlSelectedShifts.includes(shift) && styles.activeChipShift]}
                        onPress={() => setWlSelectedShifts(toggleArrayItem(wlSelectedShifts, shift))}
                      >
                        <Text style={[styles.chipText, wlSelectedShifts.includes(shift) && styles.activeChipText]}>
                          {wlSelectedShifts.includes(shift) ? `✓ ${shift}` : shift}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity
                    style={[styles.countrySelectButton, wlSelectedDates.length > 0 && styles.activeDateButton]}
                    onPress={() => {
                      setModalTargetTab('watchlist');
                      setDateModalVisible(true);
                    }}
                  >
                    <Text style={styles.countrySelectText}>
                      {wlSelectedDates.length === 0
                        ? '📅 Data ▼'
                        : wlSelectedDates.length === 1
                        ? `📅 ${availableDates.find((d) => d.date === wlSelectedDates[0])?.label || wlSelectedDates[0]} ▼`
                        : `📅 ${wlSelectedDates.length} Dias ▼`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Limpar Filtros da Watchlist */}
                {(wlSearchQuery !== '' || wlSelectedCategories.length > 0 || wlSelectedFestivalsA.length > 0 || wlSelectedGenres.length > 0 || wlSelectedCountries.length > 0 || wlSelectedVenues.length > 0 || wlSelectedShifts.length > 0 || wlSelectedDates.length > 0 || wlHideWatched) && (
                  <TouchableOpacity
                    style={{ marginTop: 8, alignSelf: 'flex-end' }}
                    onPress={() => {
                      setWlSearchQuery('');
                      setWlSelectedCategories([]);
                      setWlSelectedFestivalsA([]);
                      setWlSelectedGenres([]);
                      setWlSelectedCountries([]);
                      setWlSelectedVenues([]);
                      setWlSelectedShifts([]);
                      setWlSelectedDates([]);
                      setWlHideWatched(false);
                    }}
                  >
                    <Text style={styles.clearFiltersText}>Limpar filtros da watchlist</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {onlyCommonSessions
                ? 'Nenhuma sessão em comum encontrada entre as duas watchlists!'
                : 'Sua watchlist está vazia ou nenhum filme bateu com os filtros selecionados.'}
            </Text>
          }
          renderItem={({ item }) => {
            const isMovieWatched = watched.includes(item.movie.id);
            const isSessionInCommon =
              compareWatchlistId !== 'Nenhuma' &&
              comparisonSessions.includes(item.sessionUniqueId);

            return (
              <View style={[styles.card, isMovieWatched && styles.cardWatched]}>
                <View style={styles.titleRow}>
                  <Text style={[styles.movieTitle, isMovieWatched && styles.movieTitleWatched]}>
                    {item.movie.title}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.watchedToggleBtn, isMovieWatched && styles.watchedToggleBtnActive]}
                      onPress={() => toggleWatched(item.movie.id)}
                    >
                      <Text style={[styles.watchedToggleText, isMovieWatched && styles.watchedToggleTextActive]}>
                        {isMovieWatched ? '✅ Visto' : '👁️ Marcar visto'}
                      </Text>
                    </TouchableOpacity>

                    {item.movie.letterboxd ? (
                      <TouchableOpacity
                        style={styles.letterboxdBtn}
                        onPress={() => openLetterboxd(item.movie.letterboxd)}
                      >
                        <Text style={styles.letterboxdBtnText}>💚 Letterboxd</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={styles.badgeRow}>
                  <Text style={styles.badge}>{item.movie.section}</Text>
                  {isSessionInCommon && (
                    <Text style={styles.commonBadge}>
                      👥 Em comum com {watchlistsMap[compareWatchlistId]?.name}
                    </Text>
                  )}
                  {item.movie.festival_a ? (
                    <Text style={styles.festivalABadge}>
                      🏆 {item.movie.festival_a}
                      {item.movie.festival_a_section ? ` • ${item.movie.festival_a_section}` : ''}
                    </Text>
                  ) : null}
                  {item.movie.is_oscar ? (
                    <Text style={styles.oscarBadge}>
                      🏆 {item.movie.oscar_info || 'Oscar'}
                    </Text>
                  ) : null}
                </View>

                {item.movie.synopsis ? (
                  <Text style={[styles.synopsisText, { marginTop: 8 }]} numberOfLines={2}>
                    {item.movie.synopsis}
                  </Text>
                ) : null}

                <View style={[styles.sessionRow, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionDate}>
                      📅 {item.session.day_of_week} às {item.session.time}
                    </Text>
                    <Text style={styles.sessionVenue}>📍 {item.session.venue}</Text>
                    {item.session.address ? (
                      <Text style={styles.sessionAddress}>🏠 {item.session.address}</Text>
                    ) : null}
                    {item.session.has_qna && (
                      <Text style={styles.qnaBadge}>★ Com Debate (Q&A)</Text>
                    )}
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.uberButton}
                      onPress={() => openUber(item.session)}
                    >
                      <Text style={styles.uberButtonText}>🚗 Uber</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.gcalButton}
                      onPress={() => exportToGoogleCalendar(item.movie, item.session)}
                    >
                      <Text style={styles.gcalButtonText}>+ Agenda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => toggleWatchlist(item.sessionUniqueId)}
                    >
                      <Text style={styles.saveButtonText}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      ) : activeTab === 'vistos' ? (
        /* Aba 3: JÁ VISTOS */
        <FlatList
          data={watchedMoviesList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            watchedMoviesList.length > 0 ? (
              <TouchableOpacity
                style={styles.shareWatchlistButton}
                onPress={shareWatchedAsText}
              >
                <Text style={styles.shareWatchlistText}>
                  📱 Compartilhar Vistos no WhatsApp
                </Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Você ainda não marcou nenhum filme como visto. Toque em "👁️ Marcar visto" em qualquer filme!
            </Text>
          }
          renderItem={({ item }) => {
            const isExpanded = expandedMovies[item.id];

            return (
              <View style={[styles.card, styles.cardWatched]}>
                <View style={styles.badgeRow}>
                  <Text style={styles.watchedBadge}>✅ Visto</Text>
                  <Text style={styles.badge}>{item.section}</Text>
                  {item.festival_a ? (
                    <Text style={styles.festivalABadge}>
                      🏆 {item.festival_a}
                      {item.festival_a_section ? ` • ${item.festival_a_section}` : ''}
                    </Text>
                  ) : null}
                  {item.is_oscar ? (
                    <Text style={styles.oscarBadge}>
                      🏆 {item.oscar_info || 'Oscar'}
                    </Text>
                  ) : null}
                  {item.genre ? <Text style={styles.genreBadge}>🎬 {item.genre}</Text> : null}
                  {item.duration ? <Text style={styles.metaBadge}>⏱ {item.duration}</Text> : null}
                  {item.country ? <Text style={styles.metaBadge}>{formatCountryWithFlags(item.country)}</Text> : null}
                </View>

                <View style={styles.titleRow}>
                  <Text style={[styles.movieTitle, styles.movieTitleWatched]}>
                    {item.title}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.watchedToggleBtn, styles.watchedToggleBtnActive]}
                      onPress={() => toggleWatched(item.id)}
                    >
                      <Text style={[styles.watchedToggleText, styles.watchedToggleTextActive]}>
                        Desmarcar Visto
                      </Text>
                    </TouchableOpacity>

                    {item.letterboxd ? (
                      <TouchableOpacity
                        style={styles.letterboxdBtn}
                        onPress={() => openLetterboxd(item.letterboxd)}
                      >
                        <Text style={styles.letterboxdBtnText}>💚 Letterboxd</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {item.credits ? <Text style={styles.credits}>{item.credits}</Text> : null}

                {item.synopsis ? (
                  <View style={styles.synopsisContainer}>
                    <Text
                      style={styles.synopsisText}
                      numberOfLines={isExpanded ? undefined : 3}
                    >
                      {item.synopsis}
                    </Text>

                    {isExpanded && item.full_technical_sheet ? (
                      <View style={styles.bioBox}>
                        <Text style={styles.bioTitle}>📋 Ficha Técnica:</Text>
                        <Text style={styles.bioText}>{item.full_technical_sheet}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity onPress={() => toggleSynopsis(item.id)}>
                      <Text style={styles.expandText}>
                        {isExpanded ? 'Ler menos ▲' : 'Ler sinopse & ficha técnica completas ▼'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      ) : (
        /* Aba 4: STATS */
        <ScrollView style={styles.statsContainer} contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={styles.statsMainTitle}>📊 Minhas Estatísticas</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalWatchlistSessions}</Text>
              <Text style={styles.statLabel}>Sessões na Watchlist</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#81C784' }]}>{stats.totalWatchedMovies}</Text>
              <Text style={styles.statLabel}>Filmes Vistos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#FFB74D' }]}>{stats.watchlistTimeStr}</Text>
              <Text style={styles.statLabel}>Tempo Planejado</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#64B5F6' }]}>{stats.watchedTimeStr}</Text>
              <Text style={styles.statLabel}>Tempo Assistido</Text>
            </View>
          </View>

          <View style={styles.statsBox}>
            <Text style={styles.statsBoxTitle}>🇧🇷 Nacional vs 🌎 Internacional</Text>
            <Text style={styles.barValue}>
              🇧🇷 {stats.nationalWatched} Nacionais | 🌎 {stats.intlWatched} Internacionais
            </Text>
          </View>

          <View style={styles.statsBox}>
            <Text style={styles.statsBoxTitle}>📍 Cinemas mais Frequentados (Filmes Vistos)</Text>
            {Object.keys(stats.venueCounts).length === 0 ? (
              <Text style={styles.statsEmptyText}>
                Marque filmes como vistos para ver o ranking dos seus cinemas mais frequentados!
              </Text>
            ) : (
              Object.entries(stats.venueCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([venue, count]) => (
                  <View key={venue} style={styles.statListRow}>
                    <Text style={styles.statListTitle}>📍 {venue}</Text>
                    <Text style={styles.statListBadge}>{count} idas/sessões</Text>
                  </View>
                ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal Múltiplo de Seleção de País */}
      <Modal visible={countryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por País (Múltiplos)</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Text style={styles.closeModalText}>✓ Concluído</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => {
                if (modalTargetTab === 'programacao') setSelectedCountries([]);
                else setWlSelectedCountries([]);
              }}>
                <Text style={{ color: '#FF6B00', fontWeight: 'bold' }}>Limpar Seleção</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Pesquisar país..."
              placeholderTextColor="#888"
              value={countrySearch}
              onChangeText={setCountrySearch}
            />

            <FlatList
              data={filteredCountriesForModal}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const activeList = modalTargetTab === 'programacao' ? selectedCountries : wlSelectedCountries;
                const isSelected = activeList.includes(item);

                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedModalItem]}
                    onPress={() => {
                      if (modalTargetTab === 'programacao') {
                        setSelectedCountries(toggleArrayItem(selectedCountries, item));
                      } else {
                        setWlSelectedCountries(toggleArrayItem(wlSelectedCountries, item));
                      }
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.selectedModalItemText]}>
                      {isSelected ? '☑ ' : '☐ '} {COUNTRY_FLAGS[item] || '🌎'} {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Múltiplo de Seleção de Cinema */}
      <Modal visible={venueModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Cinema (Múltiplos)</Text>
              <TouchableOpacity onPress={() => setVenueModalVisible(false)}>
                <Text style={styles.closeModalText}>✓ Concluído</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => {
                if (modalTargetTab === 'programacao') setSelectedVenues([]);
                else setWlSelectedVenues([]);
              }}>
                <Text style={{ color: '#FF6B00', fontWeight: 'bold' }}>Limpar Seleção</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Pesquisar cinema..."
              placeholderTextColor="#888"
              value={venueSearch}
              onChangeText={setVenueSearch}
            />

            <FlatList
              data={filteredVenuesForModal}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const activeList = modalTargetTab === 'programacao' ? selectedVenues : wlSelectedVenues;
                const isSelected = activeList.includes(item);

                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedModalItem]}
                    onPress={() => {
                      if (modalTargetTab === 'programacao') {
                        setSelectedVenues(toggleArrayItem(selectedVenues, item));
                      } else {
                        setWlSelectedVenues(toggleArrayItem(wlSelectedVenues, item));
                      }
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.selectedModalItemText]}>
                      {isSelected ? '☑ ' : '☐ '} 🎬 {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Múltiplo de Seleção de Data */}
      <Modal visible={dateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Data (Múltiplas)</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Text style={styles.closeModalText}>✓ Concluído</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => {
                if (modalTargetTab === 'programacao') setSelectedDates([]);
                else setWlSelectedDates([]);
              }}>
                <Text style={{ color: '#FF6B00', fontWeight: 'bold' }}>Limpar Seleção</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableDates}
              keyExtractor={(item) => item.date}
              renderItem={({ item }) => {
                const activeList = modalTargetTab === 'programacao' ? selectedDates : wlSelectedDates;
                const isSelected = activeList.includes(item.date);

                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedModalItem]}
                    onPress={() => {
                      if (modalTargetTab === 'programacao') {
                        setSelectedDates(toggleArrayItem(selectedDates, item.date));
                      } else {
                        setWlSelectedDates(toggleArrayItem(wlSelectedDates, item.date));
                      }
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.selectedModalItemText]}>
                      {isSelected ? '☑ ' : '☐ '} 📅 {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Importação */}
      <Modal visible={importModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📥 Importar Watchlist de Amigo</Text>
              <TouchableOpacity onPress={() => setCountryImportModalVisible(false)}>
                <Text style={styles.closeModalText}>✕ Fechar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Cole o ID ou Código da lista..."
              placeholderTextColor="#888"
              value={importCodeInput}
              onChangeText={setImportCodeInput}
            />

            <TouchableOpacity
              style={styles.shareWatchlistButton}
              onPress={() => handleImportFromPayload(importCodeInput)}
            >
              <Text style={styles.shareWatchlistText}>Importar Lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#FF6B00', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#888', fontSize: 12, marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1A1A1A' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTabButton: { borderBottomWidth: 3, borderBottomColor: '#FF6B00' },
  tabText: { color: '#888', fontWeight: '600', fontSize: 11 },
  activeTabText: { color: '#FFF' },
  searchContainer: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  searchInput: { backgroundColor: '#1E1E1E', color: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, fontSize: 14 },
  filtersSection: { paddingHorizontal: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', marginBottom: 6 },
  filterLabel: { color: '#888', fontSize: 11, alignSelf: 'center', marginRight: 6, fontWeight: 'bold' },
  secondaryFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { backgroundColor: '#1E1E1E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, justifyContent: 'center' },
  activeChip: { backgroundColor: '#FF6B00' },
  activeChipGenre: { backgroundColor: '#2196F3' },
  activeChipShift: { backgroundColor: '#E91E63' },
  activeChipFestivalA: { backgroundColor: '#FFD700' },
  activeChipWatchlist: { backgroundColor: '#FF9800' },
  activeChipHideWatched: { backgroundColor: '#9E9E9E' },
  activeChipVenue: { backgroundColor: '#9C27B0' },
  chipText: { color: '#AAA', fontSize: 12, fontWeight: '500' },
  activeChipText: { color: '#111', fontWeight: 'bold' },
  countrySelectButton: { backgroundColor: '#1E1E1E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginRight: 6 },
  activeCountryButton: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  activeVenueButton: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
  activeDateButton: { backgroundColor: '#FF9800', borderColor: '#FF9800' },
  countrySelectText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  resultCountBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 4 },
  resultCountText: { color: '#777', fontSize: 11 },
  clearFiltersText: { color: '#FF6B00', fontSize: 11, fontWeight: 'bold' },
  listContent: { padding: 12 },
  watchlistHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtnHeader: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#FF6B00', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  importBtnHeaderText: { color: '#FF6B00', fontSize: 12, fontWeight: 'bold' },
  watchlistInfoCard: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  watchlistInfoTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  watchlistInfoIdBadge: { backgroundColor: '#333', color: '#FFD700', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  shareWatchlistButton: { backgroundColor: '#25D366', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center' },
  clearWatchlistButton: { backgroundColor: '#D32F2F22', borderColor: '#D32F2F', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center' },
  clearWatchlistText: { color: '#FF5252', fontSize: 12, fontWeight: 'bold' },
  shareWatchlistText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  comparisonSection: { backgroundColor: '#1A1A1A', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2A2A2A', marginTop: 12 },
  comparisonLabel: { color: '#AAA', fontSize: 12, fontWeight: 'bold' },
  commonFilterBtn: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, alignItems: 'center' },
  commonFilterBtnActive: { backgroundColor: '#9C27B0' },
  commonFilterText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  cardWatched: { borderColor: '#2E7D32', backgroundColor: '#162217' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  badge: { backgroundColor: '#2A2A2A', color: '#FF6B00', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  commonBadge: { backgroundColor: '#4A148C', color: '#E1BEE7', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  watchedBadge: { backgroundColor: '#1B5E20', color: '#81C784', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  festivalABadge: { backgroundColor: '#3A2E00', color: '#FFD700', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  oscarBadge: { backgroundColor: '#3E2723', color: '#FFB74D', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  genreBadge: { backgroundColor: '#152C3E', color: '#64B5F6', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  metaBadge: { backgroundColor: '#121212', color: '#AAA', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4, flexWrap: 'wrap', gap: 6 },
  movieTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 8 },
  movieTitleWatched: { color: '#A5D6A7' },
  watchedToggleBtn: { backgroundColor: '#2A2A2A', borderColor: '#555', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  watchedToggleBtnActive: { backgroundColor: '#2E7D32', borderColor: '#4CAF50' },
  watchedToggleText: { color: '#AAA', fontSize: 11, fontWeight: 'bold' },
  watchedToggleTextActive: { color: '#FFF' },
  letterboxdBtn: { backgroundColor: '#00E05422', borderColor: '#00E054', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  letterboxdBtnText: { color: '#00E054', fontSize: 11, fontWeight: 'bold' },
  credits: { color: '#AAA', fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  synopsisContainer: { backgroundColor: '#161616', padding: 10, borderRadius: 8, marginBottom: 12 },
  synopsisText: { color: '#DDD', fontSize: 13, lineHeight: 18 },
  bioBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  bioTitle: { color: '#FF6B00', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  bioText: { color: '#AAA', fontSize: 12, lineHeight: 16 },
  expandText: { color: '#FF6B00', fontSize: 12, fontWeight: 'bold', marginTop: 8 },
  sessionsHeader: { color: '#DDD', fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  sessionRow: { flexDirection: 'row', backgroundColor: '#121212', padding: 10, borderRadius: 8, marginVertical: 4, alignItems: 'center' },
  sessionDate: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  sessionVenue: { color: '#888', fontSize: 12, marginTop: 2 },
  sessionAddress: { color: '#666', fontSize: 11, marginTop: 2 },
  qnaBadge: { color: '#00E676', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 6 },
  uberButton: { backgroundColor: '#000', borderColor: '#333', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  uberButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  gcalButton: { backgroundColor: '#4285F4', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  gcalButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#2A2A2A', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  savedButton: { backgroundColor: '#FF6B00' },
  removeButton: { backgroundColor: '#D32F2F', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  saveButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 14, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  closeModalText: { color: '#FF6B00', fontSize: 14, fontWeight: 'bold' },
  modalSearchInput: { backgroundColor: '#121212', color: '#FFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginVertical: 12 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  selectedModalItem: { backgroundColor: '#2A2A2A' },
  modalItemText: { color: '#DDD', fontSize: 14 },
  selectedModalItemText: { color: '#FF6B00', fontWeight: 'bold' },

  statsContainer: { flex: 1, padding: 16 },
  statsMainTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { backgroundColor: '#1E1E1E', flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  statNumber: { color: '#FF6B00', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#888', fontSize: 11, textAlign: 'center' },
  statsBox: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  statsBoxTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  barValue: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  statListRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  statListTitle: { color: '#DDD', fontSize: 13, flex: 1, marginRight: 8 },
  statListBadge: { color: '#FF6B00', fontSize: 12, fontWeight: 'bold' },
  statsEmptyText: { color: '#777', fontSize: 12, fontStyle: 'italic' },
});