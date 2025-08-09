import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Grid,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CardMembership as CardIcon,
  Phone as PhoneIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { baseURL } from '../api/apiClient';
import IDCard from '../components/IDCard';

// Debounce function
const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};

// Fallback static data (your existing data as backup)
const fallbackDeaneries = {
  Ajnala: ["Ajnala", "Chamiyari", "Chogawan", "Chuchakwal", "Karyal", "Othian", "Punga", "Ramdas"],
  Amritsar: ["Amritsar Cantt.", "Bharariwal", "Gumtala", "Khasa", "Lahorigate", "Majitha Road", "Nai Abadi", "Rajasansi"],
  Dhariwal: ["Batala", "Dhariwal", "Dialgarh", "Kalanaur", "Mastkot", "Naushera Majja Singh", "Qadian"],
  "Fatehgarh Churian": ["Fatehgarh Churian", "Dera Baba Nanak", "Dharamkot Randhawa", "Ghanie Ke Banger", "Kotli", "Machi Nangal", "Majitha", "Pakharpura"],
  Ferozpur: ["Faridkot", "Ferozepur Badhni Mahafariste Wala", "Ferozpur Canal Colony", "Ferozpur Cantt", "Ferozpur City", "Gulami Wala", "Guru Har Sahai", "Lohgarh-Sur Singh Wala (Station)", "Mamdot", "Mudki (Station)", "Sadiq", "Talwandi Bhai", "Tehna, Faridkot"],
  Gurdaspur: ["Balun (Station)", "Dalhousie", "Dina Nagar", "Dorangala", "Gurdaspur", "Jandwal, Pathankot", "Kahnuwan", "Narot Jaimal Singh (Station)", "Pathankot City", "Puranashalla", "Sidhwan Jamita, Joura Chitra", "Sujanpur, Pathankot"],
  Hoshiarpur: ["Kakkon", "Baijnath", "Balachaur", "Bassi Bahian", "Bhunga", "Gaggal", "Garshankar", "Jindwari", "Mehtiana, Khanaura", "Nandachaur", "Nangal", "Palampur", "Una", "Yol Camp"],
  "Jalandhar Cantt.": ["Apra", "Banga (Station)", "Behram (Station)", "Dhina-Chittewani", "Jalandhar Cantt", "Jandiala Manjki", "Nawanshahar", "Phagwara", "Phulriwal", "Rawalpindi", "Sansarpur"],
  "Jalandhar City": ["Adampur", "Bootan", "Chogitty", "Gakhalan", "Jalandhar City", "Lambapind", "Maqsudan"],
  Kapurthala: ["Hussainpur- Lodhi Bhulana", "Kapurthala", "Kishangarh", "Kartarpur", "Mehatpur", "Nakodar", "Shahkot", "Sultanpur Lodhi"],
  Ludhiana: ["BRS Nagar", "Jagraon", "Jalandhar Bypass, Ludhiana", "Kidwai Nagar", "Phillaur", "Raekot", "Sarabha Nagar"],
  Moga: ["Baghapurana", "Buggipura, Moga (Station)", "Buttar, Moga (Station)", "Dharamkot, Moga", "Kot-Ise-Khan, Moga (Station)", "Makhu", "Moga", "Nihal Singh Wala, Moga (Station)", "Singhanwala, Moga", "Zira"],
  Muktsar: ["Abohar", "Bhagsar", "Danewala", "Fazilka", "Gidderbaha (Station)", "Jaiton", "Jalalabad", "Kotkapura", "Malout Pind", "Malout", "Muktsar, Bir Sarkar", "Muktsar", "Panjgaraian (Station)", "Sikhwala"],
  Sahnewal: ["Bhammian Kalan (Station)", "Jamalpur", "Khanna", "Khanpur-Jassar-Sangowal-Rania", "Machhiwara", "Machian Khurd", "Sahnewal", "Samrala"],
  Tanda: ["Bhogpur", "Bholath", "Dasuya", "Mukerian", "Tanda", "Sri Hargobindpur"],
  "Tarn Taran": ["Akalgarh (Station)", "Beas", "Bhikhiwind", "Bhojian", "Chabhal (Station)", "Fatehabad (Station)", "Harike", "Jandiala Guru", "Khem Karan", "Patti", "Tarn Taran"],
};

const fallbackLevelOptions = ["parish", "deanery", "dexco"];
const fallbackDesignationOptions = [
  "Member", "President", "Vice-President", "Secretary", "Joint Secretary",
  "Treasurer", "Joint Treasurer", "Media Secretary", "Joint Media Secretary",
  "Boy Representative", "Girl Representative", "Boy Spokesperson", "Girl Spokesperson",
];

const ManageProfiles = ({ authToken, user, onLogout, onEditProfile }) => {
  // State management
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    deaneries: Object.keys(fallbackDeaneries),
    parishes: [],
    levels: fallbackLevelOptions,
    designations: fallbackDesignationOptions,
    deanery_parish_map: fallbackDeaneries
  });
  
  // Filter states - Enhanced for server-side filtering
  const [filters, setFilters] = useState({
    search: '',
    deanery: '',
    parish: '',
    level: '',
    designation: '',
    sort_by: 'created_at',
    sort_order: 'DESC'
  });
  
  // Pagination - Enhanced for server-side pagination
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    total_pages: 0
  });
  
  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState({ open: false, profileId: null, loading: false });
  const [idCardDialog, setIdCardDialog] = useState({ open: false, profileData: null });

  // Debounced search - Enhanced
  const debouncedSearch = useMemo(
    () => debounce((searchValue) => {
      setFilters(prev => ({ ...prev, search: searchValue }));
      setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page on search
    }, 500),
    []
  );

  // Fetch filter options from API
  const fetchFilterOptions = useCallback(async () => {
    if (!authToken) return;

    try {
      const response = await axios.get(`${baseURL}/profiles/filter-options`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error('Fetch filter options error:', error);
      // Keep fallback data if API fails
      if (error.response?.status === 401) {
        onLogout();
      }
    }
  }, [authToken, onLogout]);

  // Enhanced fetch profiles with server-side filtering and pagination
  const fetchProfiles = useCallback(async (resetPage = false) => {
    if (!authToken) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', resetPage ? '1' : (pagination.page + 1).toString());
      params.append('limit', pagination.limit.toString());
      
      // Add filters only if they have values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          params.append(key, value.toString().trim());
        }
      });

      const response = await axios.get(`${baseURL}/profiles?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const { profiles: fetchedProfiles, pagination: paginationData } = response.data.data;
        setProfiles(fetchedProfiles || []);
        setPagination(prev => ({
          ...prev,
          total: paginationData.total,
          total_pages: paginationData.total_pages,
          page: resetPage ? 0 : prev.page
        }));
      } else {
        toast.error('Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Fetch profiles error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      } else {
        toast.error('Failed to fetch profiles');
      }
    } finally {
      setLoading(false);
    }
  }, [authToken, onLogout, filters, pagination.page, pagination.limit]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      
      // Reset parish when deanery changes
      if (filterName === 'deanery') {
        newFilters.parish = '';
      }
      
      return newFilters;
    });
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      search: '',
      deanery: '',
      parish: '',
      level: '',
      designation: '',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Delete profile
  const handleDeleteProfile = async (profileId) => {
    setDeleteDialog(prev => ({ ...prev, loading: true }));
    try {
      const response = await axios.delete(`${baseURL}/profiles/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Profile deleted successfully');
        await fetchProfiles(true); // Reset to first page after deletion
      } else {
        toast.error('Failed to delete profile');
      }
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      } else {
        toast.error('Failed to delete profile');
      }
    }
    setDeleteDialog({ open: false, profileId: null, loading: false });
  };

  // Handle edit profile
  const handleEditClick = (profileData) => {
    if (onEditProfile) {
      onEditProfile(profileData);
      console.log(profileData,'profileData');
      
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({ 
      ...prev, 
      limit: newLimit,
      page: 0 
    }));
  };

  // Get available parishes based on selected deanery
  const getAvailableParishes = useMemo(() => {
    return filters.deanery && filterOptions.deanery_parish_map[filters.deanery] 
      ? filterOptions.deanery_parish_map[filters.deanery] 
      : [];
  }, [filters.deanery, filterOptions.deanery_parish_map]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.deanery || filters.parish || filters.level || filters.designation;
  }, [filters]);

  // Table headers
const tableHeaders = [
  { id: 'id', label: 'ID', width: 70 },
  { id: 'name', label: 'Name', width: 200 },
  { id: 'parent', label: 'Parent', width: 150 },
  { id: 'deanery', label: 'Deanery', width: 150 },
  { id: 'parish', label: 'Parish', width: 180 },
  { id: 'level', label: 'Level', width: 100 },
  { id: 'issue_date', label: 'Issue Date', width: 120 },
  { id: 'actions', label: 'Actions', width: 150 },
];

  // Effects
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, mb: 1 }}>
        Manage Profiles
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View, edit, and manage all ID card profiles
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Profile Management</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearAllFilters}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => fetchProfiles(true)}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          }
        />
        <CardContent>
          {/* Enhanced Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search profiles..."
                defaultValue={filters.search}
                onChange={(e) => debouncedSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Deanery</InputLabel>
                <Select
                  value={filters.deanery}
                  label="Deanery"
                  onChange={(e) => handleFilterChange('deanery', e.target.value)}
                >
                  <MenuItem value="">All Deaneries</MenuItem>
                  {filterOptions.deaneries.map((deanery) => (
                    <MenuItem key={deanery} value={deanery}>
                      {deanery}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Parish</InputLabel>
                <Select
                  value={filters.parish}
                  label="Parish"
                  onChange={(e) => handleFilterChange('parish', e.target.value)}
                  disabled={!filters.deanery}
                >
                  <MenuItem value="">All Parishes</MenuItem>
                  {getAvailableParishes.map((parish) => (
                    <MenuItem key={parish} value={parish}>
                      {parish}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Level</InputLabel>
                <Select
                  value={filters.level}
                  label="Level"
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {filterOptions.levels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Designation</InputLabel>
                <Select
                  value={filters.designation}
                  label="Designation"
                  onChange={(e) => handleFilterChange('designation', e.target.value)}
                >
                  <MenuItem value="">All Designations</MenuItem>
                  {filterOptions.designations.map((designation) => (
                    <MenuItem key={designation} value={designation}>
                      {designation}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1 }}>
                Active Filters:
              </Typography>
              {filters.search && (
                <Chip
                  size="small"
                  label={`Search: "${filters.search}"`}
                  onDelete={() => handleFilterChange('search', '')}
                />
              )}
              {filters.deanery && (
                <Chip
                  size="small"
                  label={`Deanery: ${filters.deanery}`}
                  onDelete={() => handleFilterChange('deanery', '')}
                />
              )}
              {filters.parish && (
                <Chip
                  size="small"
                  label={`Parish: ${filters.parish}`}
                  onDelete={() => handleFilterChange('parish', '')}
                />
              )}
              {filters.level && (
                <Chip
                  size="small"
                  label={`Level: ${filters.level}`}
                  onDelete={() => handleFilterChange('level', '')}
                />
              )}
              {filters.designation && (
                <Chip
                  size="small"
                  label={`Designation: ${filters.designation}`}
                  onDelete={() => handleFilterChange('designation', '')}
                />
              )}
            </Box>
          )}

          {/* Results Summary */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {loading ? (
                <Skeleton width={200} />
              ) : (
                `Showing ${profiles.length} of ${pagination.total} profiles`
              )}
            </Typography>
            {hasActiveFilters && (
              <Chip
                icon={<FilterIcon />}
                label={`${pagination.total} results`}
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          {/* Enhanced Data Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableCell key={header.id} sx={{ fontWeight: 600 }}>
                      {header.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: pagination.limit }).map((_, index) => (
                    <TableRow key={index}>
                      {tableHeaders.map((header) => (
                        <TableCell key={header.id}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          No profiles found
                        </Typography>
                        {hasActiveFilters && (
                          <Button
                            size="small"
                            onClick={clearAllFilters}
                            sx={{ mt: 1 }}
                          >
                            Clear filters to see all profiles
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
              profiles.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={row.photo_url || ''}
                        sx={{ mr: 1.5, width: 43, height: 43 }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.name}
                        </Typography>
                        {row.designation && (
                          <Typography variant="caption" color="text.secondary">
                            {row.designation}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.father || row.mother || '-'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {row.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{row.deanery}</TableCell>
                  <TableCell>{row.parish}</TableCell>
                  <TableCell>
                    {row.level ? (
                      <Chip
                        label={row.level}
                        size="small"
                        color={row.level === 'parish' ? 'success' : row.level === 'deanery' ? 'warning' : 'info'}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell>{row.issue_date ? dayjs(row.issue_date).format('DD/MM/YYYY') : '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Generate ID Card">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setIdCardDialog({ open: true, profileData: row })}
                        >
                          <CardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Profile">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleEditClick(row)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Profile">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, profileId: row.id, loading: false })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Enhanced Pagination */}
          {!loading && profiles.length > 0 && (
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={handleChangePage}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              showFirstButton
              showLastButton
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, profileId: null, loading: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this profile? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, profileId: null, loading: false })}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleDeleteProfile(deleteDialog.profileId)}
            disabled={deleteDialog.loading}
            startIcon={deleteDialog.loading ? <CircularProgress size={20} /> : null}
          >
            {deleteDialog.loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ID Card Preview Dialog */}
      <Dialog
        open={idCardDialog.open}
        onClose={() => setIdCardDialog({ open: false, profileData: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>ID Card Preview</DialogTitle>
        <DialogContent>
          {idCardDialog.profileData && (
            <IDCard 
              data={{
                ...idCardDialog.profileData,
                photo: idCardDialog.profileData.photo_url,
                father_name: idCardDialog.profileData.father,
                mother_name: idCardDialog.profileData.mother,
                date_of_birth: idCardDialog.profileData.dob,
                postal_address: idCardDialog.profileData.postal_address,
                qualification: idCardDialog.profileData.qualification,
              }} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIdCardDialog({ open: false, profileData: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageProfiles;